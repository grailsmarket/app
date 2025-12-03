import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash } from 'viem'
import puppeteerCore, { LaunchOptions } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name') || 'Unknown'

  const getENSSVG = async () => {
    try {
      // Try wrapped domain first
      const nameHash = namehash(name)
      const wrappedResponse = await fetch(`${WRAPPED_DOMAIN_IMAGE_URL}/${nameHash}/image`)

      if (wrappedResponse.status === 200) {
        return await wrappedResponse.text()
      }

      // Try unwrapped domain
      const labelHash = labelhash(name.replace('.eth', ''))
      const unwrappedResponse = await fetch(`${UNWRAPPED_DOMAIN_IMAGE_URL}/${labelHash}/image`)

      if (unwrappedResponse.status === 200) {
        return await unwrappedResponse.text()
      }

      return null
    } catch (error) {
      console.error('Error fetching ENS SVG:', error)
      return null
    }
  }

  const ensSVG = await getENSSVG()
  const displayName = name.includes('.') ? name : `${name}.eth`

  let browser
  let page
  try {
    const executablePath = await getChromiumPath()
    const launchOptions = {
      executablePath,
      args: chromium.args,
      headless: true,
      defaultViewport: { width: size.width, height: size.height },
      ignoreHTTPSErrors: true,
      // Add these for better stability locally
      ...(process.env.VERCEL_ENV ? {} : {
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      })
    }

    console.log('Launching browser with executable path:', executablePath)
    browser = await puppeteerCore.launch(launchOptions as LaunchOptions)
    page = await browser.newPage()

    // Set user agent to avoid detection issues
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Create HTML content
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
            ${ensSVG ? ensSVG : `<div class="fallback">${displayName}</div>`}
          </div>
          <div
            style="height: 80px; width: 2px; background-color: #ffffff;"
          ></div>
          <img class="logo" src="https://grails.app/your-ens-market-logo.png" alt="Grails Logo" />
        </body>
      </html>
    `

    // Set content with more robust error handling
    try {
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      })
    } catch (error) {
      console.error('Error setting page content:', error)
      // Try a simpler approach
      await page.goto(`data:text/html,${encodeURIComponent(htmlContent)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      })
    }

    // Wait a bit for any final rendering
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Generate screenshot with error handling
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    })

    // Close page before browser
    await page.close()
    await browser.close()

    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        'CDN-Cache-Control': 'max-age=86400',
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