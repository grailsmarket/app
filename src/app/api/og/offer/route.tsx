import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash, isAddress } from 'viem'
import puppeteerCore, { LaunchOptions } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { formatUnits } from 'viem'
import { DomainOfferType } from '@/types/domains'
import { truncateAddress, fetchAccount } from 'ethereum-identity-kit/utils'
import { beautifyName } from '@/lib/ens'

const size = {
  width: 1600,
  height: 836,
}

const WRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
const UNWRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${APP_ENS_ADDRESS}`

const CHROMIUM_PACK_URL = `https://${process.env.VERCEL_URL}/chromium-pack.tar`

let cachedExecutablePath: string | null = null
let downloadPromise: Promise<string> | null = null

async function getChromiumPath(): Promise<string> {
  if (!!process.env.VERCEL_ENV) {
    if (cachedExecutablePath) return cachedExecutablePath

    if (!downloadPromise) {
      downloadPromise = chromium
        .executablePath(CHROMIUM_PACK_URL)
        .then((path) => {
          cachedExecutablePath = path
          return path
        })
        .catch((error) => {
          console.error('Failed to get Chromium path:', error)
          downloadPromise = null
          throw error
        })
    }

    return downloadPromise
  }

  if (!!process.env.CHROMIUM_LOCAL_EXEC_PATH) {
    return Promise.resolve(process.env.CHROMIUM_LOCAL_EXEC_PATH)
  }

  throw new Error('Missing a path for Chromium executable')
}

type OfferRequestBody = {
  offer: DomainOfferType
  name: string
  token_id: string
  expiry_date: string | null
  owner_address: string | null
}

const SOURCE_LOGO_URLS: Record<string, string> = {
  opensea: 'https://grails.app/logos/opensea.svg',
  grails: 'https://grails.app/logo.png',
  ensvision: 'https://grails.app/logos/ensvision.svg',
}

const formatPrice = (priceWei: string, currencyAddress: string): string => {
  const isUSDC = currencyAddress.toLowerCase() === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
  const decimals = isUSDC ? 6 : 18
  const value = parseFloat(formatUnits(BigInt(priceWei), decimals))

  if (value >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 })
  }
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
}

const formatExpiryDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getCurrencySymbol = (currencyAddress: string): string => {
  const address = currencyAddress.toLowerCase()
  if (address === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48') return 'USDC'
  if (address === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') return 'WETH'
  return 'WETH'
}

export async function POST(req: NextRequest) {
  let browser
  let page

  try {
    const body: OfferRequestBody = await req.json()
    const { offer, name, owner_address } = body

    if (!offer || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const amount = formatPrice(offer.offer_amount_wei, offer.currency_address)
    const currency = getCurrencySymbol(offer.currency_address)
    const sourceLogo = SOURCE_LOGO_URLS[offer.source] || SOURCE_LOGO_URLS.grails
    const expiresFormatted = formatExpiryDate(offer.expires_at)
    const displayName = name.endsWith('.eth') ? name : `${name}.eth`
    const defaultAvatar = 'https://efp.app/assets/art/default-avatar.svg'

    // Fetch owner profile
    const getOwnerProfile = async () => {
      if (!owner_address) return { avatar: defaultAvatar, displayName: '' }
      try {
        const response = await fetchAccount(owner_address)
        if (response === null) {
          return {
            avatar: defaultAvatar,
            displayName: isAddress(owner_address) ? truncateAddress(owner_address as `0x${string}`) : owner_address,
          }
        }
        return {
          avatar: response.ens?.avatar || defaultAvatar,
          displayName: response.ens?.name || truncateAddress(owner_address as `0x${string}`),
        }
      } catch (error) {
        console.error('Error fetching owner profile:', error)
        return {
          avatar: defaultAvatar,
          displayName: isAddress(owner_address) ? truncateAddress(owner_address as `0x${string}`) : owner_address,
        }
      }
    }

    const getOfferrerProfile = async () => {
      if (!offer.buyer_address) return { avatar: defaultAvatar, displayName: '' }
      try {
        const response = await fetchAccount(offer.buyer_address)
        if (response === null) {
          return {
            avatar: defaultAvatar,
            displayName: isAddress(offer.buyer_address)
              ? truncateAddress(offer.buyer_address as `0x${string}`)
              : offer.buyer_address,
          }
        }
        return {
          avatar: response.ens?.avatar || defaultAvatar,
          displayName: response.ens?.name || truncateAddress(offer.buyer_address as `0x${string}`),
        }
      } catch (error) {
        console.error('Error fetching offerrer profile:', error)
        return {
          avatar: defaultAvatar,
          displayName: isAddress(offer.buyer_address)
            ? truncateAddress(offer.buyer_address as `0x${string}`)
            : offer.buyer_address,
        }
      }
    }

    const ownerProfile = await getOwnerProfile()
    const offerrerProfile = await getOfferrerProfile()

    // Get ENS SVG
    const getENSSVG = async () => {
      try {
        const nameHash = namehash(displayName)
        const labelHash = labelhash(displayName.replace('.eth', ''))

        const [wrappedResult, unwrappedResult] = await Promise.all([
          fetch(`${WRAPPED_DOMAIN_IMAGE_URL}/${nameHash}/image`)
            .then((res) => (res.status === 200 ? res.text() : null))
            .catch(() => null),
          fetch(`${UNWRAPPED_DOMAIN_IMAGE_URL}/${labelHash}/image`)
            .then((res) => (res.status === 200 ? res.text() : null))
            .catch(() => null),
        ])

        return wrappedResult || unwrappedResult || null
      } catch (error) {
        console.error('Error fetching ENS SVG:', error)
        return null
      }
    }

    const ensSVG = await getENSSVG()

    const executablePath = await getChromiumPath()
    const launchOptions = {
      executablePath,
      args: [
        ...chromium.args,
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--no-first-run',
        '--no-default-browser-check',
      ],
      headless: true,
      defaultViewport: { width: size.width, height: size.height },
      ignoreHTTPSErrors: true,
      ...(process.env.VERCEL_ENV
        ? {}
        : {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          }),
    }

    browser = await puppeteerCore.launch(launchOptions as LaunchOptions)
    page = await browser.newPage()

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: ${size.width}px;
              height: ${size.height}px;
              background: radial-gradient(circle, #444444, #222222);
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              gap: 80px;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #f4f4f4;
              padding: 80px;
            }
            .ens-image-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 20px;
            }
            .listed-label {
              font-size: 64px;
              font-weight: 700;
              color: #ffffff;
              background-color: #ED34E7;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-radius: 24px;
              padding: 20px 0px;
              text-align: center;
              width: 560px;
              height: 108px;
            }
            .ens-image {
              width: 560px;
              height: 560px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 32px;
              overflow: hidden;
              flex-shrink: 0;
              padding: 0;
            }
            .ens-image svg {
              width: 560px !important;
              height: 560px !important;
              width: auto;
              height: auto;
              border-radius: 32px !important;
            }
            .fallback {
              width: 560px;
              height: 560px;
              background-color: #222222;
              border-radius: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 64px;
              font-weight: 700;
              color: white;
              text-align: center;
              padding: 40px;
              word-break: break-all;
            }
            .divider {
              height: 480px;
              width: 3px;
              background: #cccccc;
              border-radius: 8px;
              flex-shrink: 0;
            }
            .info {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 24px;
              max-width: 700px;
            }
            .domain-name {
              font-size: 72px;
              font-weight: 700;
              max-width: 700px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .label {
              font-size: 56px;
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: 600;
            }
            .price-container {
              display: flex;
              align-items: center;
              gap: 28px;
            }
            .price {
              font-size: 96px;
              font-weight: 700;
              color: #ffdfc0;
            }
            .expires {
              padding-bottom: 8px;
              font-size: 48px;
              color: #cccccc;
            }
            .source {
              display: flex;
              align-items: center;
              gap: 32px;
              margin-top: 8px;
            }
            .source-label {
              font-size: 56px;
              color: #ffffff;
              font-weight: 600;
            }
            .source-logo {
              width: auto;
              height: 72px;
            }
            .grails-logo {
              margin-top: 24px;
              width: 380px;
              height: auto;
            }
            .owner {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              max-width: 740px;
              gap: 16px;
            }
            .owner-container {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            .owner-label {
              font-size: 42px;
              color: #cccccc;
              font-weight: 600;
            }
            .owner-avatar {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              object-fit: cover;
            }
            .owner-name {
              font-size: 48px;
              color: #cccccc;
              max-width: 520px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .domain-link {
              font-size: 44px;
              color: #ffdfc0;
              max-width: 700px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
        <div class="ens-image-container">
          <p class="listed-label">OFFER</p>
            <div class="ens-image">
  
              ${ensSVG ? ensSVG : `<div class="fallback">${displayName}</div>`}
            </div>
        </div>
          <div class="divider"></div>
          <div class="info">
          <div class="price-container"><p class="price">${amount} ${currency}</p><img class="source-logo" src="${sourceLogo}" alt="source" /></div>
            <div class="expires">Expires: ${expiresFormatted}</div>
            ${
              offerrerProfile?.displayName
                ? `<div class="owner">
            <p class="owner-label">Bidder:</p>
              <div class="owner-container">
              <img class="owner-avatar" src="${offerrerProfile.avatar}" alt="owner" />
              <span class="owner-name">${offerrerProfile.displayName}</span>
              </div>
            </div>`
                : ''
            }
            ${
              ownerProfile.displayName
                ? `<div class="owner">
              <p class="owner-label">Owner:</p>
              <div class="owner-container">
                <img class="owner-avatar" src="${ownerProfile.avatar}" alt="owner" />
                <span class="owner-name">${ownerProfile.displayName}</span>
              </div>
            </div>`
                : ''
            }
            <p class="domain-link">grails.app/${beautifyName(name)}</p>
            <img class="grails-logo" src="https://grails.app/your-ens-market-logo.png" alt="Grails" />
          </div>
        </body>
      </html>
    `

    try {
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })
    } catch {
      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })
    }

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    })

    await page.close()
    await browser.close()

    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error generating offer image:', error)

    if (page) {
      try {
        await page.close()
      } catch (e) {
        console.error('Error closing page:', e)
      }
    }

    if (browser) {
      try {
        await browser.close()
      } catch (e) {
        console.error('Error closing browser:', e)
      }
    }

    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
