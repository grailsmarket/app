import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { hexToBigInt, labelhash, namehash } from 'viem'
import puppeteerCore, { LaunchOptions } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { WEEK_IN_SECONDS } from '@/constants/time'

const size = {
  width: 800,
  height: 418,
}

export const WRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${APP_ENS_ADDRESS}`

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
          console.log('Chromium path resolved:', path)
          return path
        })
        .catch((error) => {
          console.error('Failed to get Chromium path:', 'trying to use chromium pack from:', CHROMIUM_PACK_URL, error)
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

// Regex to match emoji characters (excludes variation selectors and other invisible components)
const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu

// Replace emojis with Apple emoji images from CDN (for HTML)
const replaceEmojisWithImages = (text: string, size: number = 48): string => {
  return text.replace(emojiRegex, (emoji) => {
    const encodedEmoji = encodeURIComponent(emoji)
    return `<img src="https://emojicdn.elk.sh/${encodedEmoji}?style=apple" alt="${emoji}" style="height: ${size}px; width: ${size}px; display: inline-block; vertical-align: middle;" />`
  })
}

// Process SVG to replace emojis in text elements with image elements
const processEnsSvgEmojis = (svg: string): string => {
  return svg.replace(/<text([^>]*)>([^<]*)<\/text>/g, (match, attrs, textContent) => {
    if (!emojiRegex.test(textContent)) {
      return match
    }

    emojiRegex.lastIndex = 0

    const xMatch = attrs.match(/x="([^"]*)"/)
    const yMatch = attrs.match(/y="([^"]*)"/)
    const fontSizeMatch = attrs.match(/font-size="([^"]*)"/)

    const baseX = xMatch ? parseFloat(xMatch[1]) : 0
    const baseY = yMatch ? parseFloat(yMatch[1]) : 0
    const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 24

    let result = ''
    let currentX = baseX
    let lastIndex = 0
    let emojiMatch

    emojiRegex.lastIndex = 0

    while ((emojiMatch = emojiRegex.exec(textContent)) !== null) {
      const textBefore = textContent.slice(lastIndex, emojiMatch.index)
      if (textBefore) {
        result += `<text${attrs.replace(/x="[^"]*"/, `x="${currentX}"`)}>${textBefore}</text>`
        currentX += textBefore.length * fontSize * 0.6
      }

      const emoji = emojiMatch[0]
      const encodedEmoji = encodeURIComponent(emoji)
      const emojiSize = fontSize * 0.9
      result += `<image href="https://emojicdn.elk.sh/${encodedEmoji}?style=apple" x="${currentX}" y="${baseY - emojiSize * 0.9}" width="${emojiSize}" height="${emojiSize}" preserveAspectRatio="xMidYMid meet" />`
      currentX += emojiSize * 0.85

      lastIndex = emojiMatch.index + emoji.length
    }

    const textAfter = textContent.slice(lastIndex)
    if (textAfter) {
      result += `<text${attrs.replace(/x="[^"]*"/, `x="${currentX}"`)}>${textAfter}</text>`
    }

    return result
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = decodeURIComponent(searchParams.get('name') || '')

  if (name === '') {
    return NextResponse.json(
      { error: 'Name is required' },
      {
        status: 400,
      }
    )
  }

  if (name.replace('.eth', '').length < 3) {
    return NextResponse.json(
      { error: 'Invalid ENS name' },
      {
        status: 400,
      }
    )
  }

  const getENSSVG = async () => {
    try {
      // Calculate both hashes upfront
      const nameHash = namehash(name)
      const labelHash = labelhash(name.replace('.eth', ''))

      // Make both requests in parallel
      const [wrappedResult, unwrappedResult] = await Promise.all([
        fetch(`${WRAPPED_DOMAIN_IMAGE_URL}/${nameHash}/image`)
          .then((res) => (res.status === 200 ? res.text() : null))
          .catch(() => null),
        fetch(`${UNWRAPPED_DOMAIN_IMAGE_URL}/${labelHash}/image`)
          .then((res) => (res.status === 200 ? res.text() : null))
          .catch(() => null),
      ])

      // Return the first successful result
      const tokenId = hexToBigInt(labelHash).toString()
      return (
        wrappedResult ||
        unwrappedResult ||
        `https://grails.app/api/og/ens-name/${tokenId}?name=${name}?expires=${encodeURIComponent(new Date().getTime() + WEEK_IN_SECONDS * 1000)}`
      )
    } catch (error) {
      console.error('Error fetching ENS SVG:', error)
      return null
    }
  }

  const ensSVG = await getENSSVG()
  const displayName = name.endsWith('.eth') ? name : `${name}.eth`

  let browser
  let page
  try {
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
      // Add these for better stability locally
      ...(process.env.VERCEL_ENV
        ? {}
        : {
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          }),
    }

    console.log('Launching browser with executable path:', executablePath)
    browser = await puppeteerCore.launch(launchOptions as LaunchOptions)
    page = await browser.newPage()

    // Create HTML content
    const htmlContent = `
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
              gap: 36px;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #f4f4f4;
              text-align: center;
              font-weight: 700;
            }
            .ens-image {
              width: 300px;
              height: 300px;
              display: flex;
              align-items: center;
              justify-content: center;
              scale: 1.1;
            }
            .ens-image svg {
              max-width: 300px;
              max-height: 300px;
              width: auto;
              height: auto;
              border-radius: 8px;
            }
            .fallback {
              width: 256px;
              height: 256px;
              background-color: #5298FF;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 48px;
              font-weight: 700;
              color: white;
            }
            .logo {
              width: 232px;
              height: 71px;
            }
          </style>
        </head>
        <body>
          <div class="ens-image">
            ${typeof ensSVG === 'string' && ensSVG.startsWith('<svg') ? processEnsSvgEmojis(ensSVG) : `<div class="fallback">${replaceEmojisWithImages(displayName, 42)}</div>`}
          </div>
          <div
            style="height: 80px; width: 2px; background-color: #ffffff;"
          ></div>
          <img class="logo" src="https://grails.app/your-ens-market-logo.png" alt="Grails Logo" />
        </body>
      </html>
    `

    // Set content with optimized settings
    try {
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0', // More efficient, waits for all network requests to finish
        timeout: 10000,
      })
    } catch (error) {
      console.error('Error setting page content:', error)
      // Try a simpler approach with reduced timeout
      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`, {
        waitUntil: 'networkidle0',
        timeout: 10000,
      })
    }

    // Removed 500ms wait - networkidle0 ensures page is ready

    // Generate screenshot with error handling
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    })

    // Close page before browser
    await page.close()
    await browser.close()

    // Cache for 7 days
    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'max-age=604800',
        'Vercel-CDN-Cache-Control': 'max-age=604800',
      },
    })
  } catch (error) {
    console.error('Error generating image with Puppeteer:', error)

    // Clean up resources
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
