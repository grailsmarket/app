import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash, isAddress } from 'viem'
import puppeteerCore, { LaunchOptions } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { formatUnits } from 'viem'
import { truncateAddress as truncateAddr, fetchAccount } from 'ethereum-identity-kit/utils'
import { TOKENS } from '@/constants/web3/tokens'
import { beautifyName } from '@/lib/ens'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

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
  const token = TOKENS[address as keyof typeof TOKENS]
  return token || 'ETH'
}

export async function GET(req: NextRequest) {
  let browser
  let page

  try {
    const searchParams = req.nextUrl.searchParams
    const name = searchParams.get('name')
    const priceWei = searchParams.get('price')
    const currencyAddress = searchParams.get('currency')
    const source = searchParams.get('source')
    const expires = searchParams.get('expires')
    const owner_address = searchParams.get('owner')
    const categories = searchParams.get('categories')?.split(',') || []

    if (!name || !priceWei || !currencyAddress || !source || !expires) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const price = formatPrice(priceWei, currencyAddress)
    const currency = getCurrencySymbol(currencyAddress)
    const sourceLogo = SOURCE_LOGO_URLS[source] || SOURCE_LOGO_URLS.grails
    const expiresFormatted = formatExpiryDate(expires)
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
            displayName: isAddress(owner_address) ? truncateAddr(owner_address as `0x${string}`) : owner_address,
          }
        }
        return {
          avatar: response.ens?.avatar || defaultAvatar,
          displayName: response.ens?.name || truncateAddr(owner_address as `0x${string}`),
        }
      } catch (error) {
        console.error('Error fetching owner profile:', error)
        return {
          avatar: defaultAvatar,
          displayName: isAddress(owner_address) ? truncateAddr(owner_address as `0x${string}`) : owner_address,
        }
      }
    }

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

    // Pre-fetch category avatars as base64 data URIs to avoid redirect/CORS issues in Puppeteer
    const getCategoryAvatarDataUris = async (): Promise<Record<string, string>> => {
      if (categories.length === 0) return {}
      const entries = await Promise.all(
        categories.map(async (category) => {
          try {
            const res = await fetch(`https://api.grails.app/api/v1/clubs/${category}/avatar`)
            if (!res.ok) return [category, ''] as const
            const buffer = await res.arrayBuffer()
            const contentType = res.headers.get('content-type') || 'image/jpeg'
            const base64 = Buffer.from(buffer).toString('base64')
            return [category, `data:${contentType};base64,${base64}`] as const
          } catch {
            return [category, ''] as const
          }
        })
      )
      return Object.fromEntries(entries)
    }

    // Fetch all data in parallel
    const [ownerProfile, ensSVG, categoryAvatars] = await Promise.all([
      getOwnerProfile(),
      getENSSVG(),
      getCategoryAvatarDataUris(),
    ])

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
          <link href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            svg text, svg tspan { font-family: 'Inter', sans-serif, 'Noto Color Emoji' !important; }
            body {
              width: ${size.width}px;
              height: ${size.height}px;
              background: radial-gradient(circle, #444444, #222222);
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: center;
              gap: 80px;
              color: #f4f4f4;
              padding: 80px;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .price, .expires, .owner-name, .category-label, .source-label, .label, .listed-label {
              font-variant-emoji: text;
              text-rendering: optimizeLegibility;
            }
            .ens-image-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0px;
            }
            .listed-label {
              font-size: 60px;
              font-weight: 700;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #222222;
              background-color: #ffdfc0;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-radius: 20px 20px 0px 0px;
              text-align: center;
              width: 560px;
              height: 96px;
            }
            .ens-image {
              width: 560px;
              height: 560px;
              display: flex;
              padding: 0;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              flex-shrink: 0;
              border-radius: ${categories.length > 0 ? '0px' : '0px 0px 20px 20px'} !important;
            }
            .ens-image svg {
              width: 560px !important;
              height: 560px !important;
              width: auto;
              height: auto;
              border-radius: ${categories.length > 0 ? '0px' : '0px 0px 20px 20px'} !important;
            }
            .fallback {
              width: 560px;
              height: 560px;
              background-color: #5298FF;
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
            .categories {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: ${categories.length > 1 ? 'flex-start' : 'center'};
              width: 560px;
              gap: 24px;
              overflow-x: scroll;
              background-color: #444444;
              border-radius: 0px 0px 20px 20px;
              padding: ${categories.length > 1 ? '18px 0px 18px 24px' : '18px'};
            }
            .category {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: ${categories.length > 1 ? 'flex-start' : 'center'};
              gap: 16px;
            }
            .category-divider {
              font-size: 44px;
              color: #ffffff;
              font-weight: 600;
              padding-right: 16px;
            }
            .category-logo {
              width: 64px;
              height: 64px;
              min-width: 64px;
              min-height: 64px;
              border-radius: 50%;
              object-fit: cover;
            }
            .category-label {
              font-size: 44px;
              color: #ffffff;
              font-weight: 600;
              text-wrap: nowrap;
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
              gap: 32px;
            }
            .price {
              font-size: 96px;
              font-weight: 700;
              color: #ffdfc0;
            }
            .expires {
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
              align-items: center;
              gap: 24px;
              margin-top: 8px;
              padding: 8px 0px;
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
              max-width: 560px;
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
              font-family: 'Inter', system-ui, -apple-system, sans-serif, 'Noto Color Emoji';
            }
          </style>
        </head>
        <body>
          <div class="ens-image-container">
            <p class="listed-label">LISTING</p>
            <div class="ens-image">
              ${ensSVG ? ensSVG : `<div class="fallback">${displayName}</div>`}
            </div>
            ${
              categories.length > 0
                ? `<div class="categories">
                    ${categories
                      .map(
                        (category) => `<div class="category">
                      ${categoryAvatars[category] ? `<img class="category-logo" src="${categoryAvatars[category]}" alt="category" />` : ''}
                      <p class="category-label">${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category}</p>
                    </div>`
                      )
                      .join('')}
                  </div>`
                : ''
            }
          </div>
          <div class="divider"></div>
          <div class="info">
          <div class="price-container"><p class="price">${price} ${currency}</p> <img class="source-logo" src="${sourceLogo}" alt="source" /></div>
            <div class="expires">Ends: ${expiresFormatted}</div>
            ${
              ownerProfile.displayName
                ? `<div class="owner">
              <img class="owner-avatar" src="${ownerProfile.avatar}" alt="owner" />
              <span class="owner-name">${ownerProfile.displayName}</span>
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
    console.error('Error generating listing image:', error)

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
