import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash } from 'viem'

// Configure for Node.js runtime (required for Puppeteer)
export const runtime = 'nodejs'

const size = {
  width: 800,
  height: 418,
}

export const WRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${APP_ENS_ADDRESS}`

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

  // Launch Puppeteer browser with environment detection
  const isVercel = !!process.env.VERCEL_ENV
  let puppeteer: any
  let launchOptions: any = {
    headless: true,
  }

  if (isVercel) {
    const chromium = (await import('@sparticuz/chromium')).default
    puppeteer = await import('puppeteer-core')

    // Add font rendering arguments for better emoji support
    const customArgs = [...chromium.args, '--disable-web-security', '--no-sandbox', '--font-render-hinting=none']

    launchOptions = {
      ...launchOptions,
      args: customArgs,
      executablePath: await chromium.executablePath(),
    }
  } else {
    puppeteer = await import('puppeteer')
    launchOptions = {
      ...launchOptions,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--run-all-compositor-stages-before-draw',
        '--disable-background-timer-throttling',
        '--disable-renderer-backgrounding',
        '--disable-backgrounding-occluded-windows',
        '--disable-ipc-flooding-protection',
      ],
      executablePath: process.env.CHROME_BIN || undefined,
    }
  }

  let browser
  try {
    browser = await puppeteer.launch(launchOptions)

    const page = await browser.newPage()

    // Optimize page for faster rendering
    await page.setRequestInterception(true)
    page.on('request', (req: any) => {
      // Block unnecessary resource types for faster loading
      const resourceType = req.resourceType()
      if (resourceType === 'stylesheet' || resourceType === 'script' || resourceType === 'font') {
        req.continue()
      } else if (resourceType === 'image' && req.url().includes('grails.app')) {
        req.continue() // Allow our logo
      } else if (resourceType === 'image') {
        req.abort() // Block other images
      } else {
        req.continue()
      }
    })

    await page.setViewport({ width: size.width, height: size.height })

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

    // Set content and wait for network to be idle (with timeout)
    await page.setContent(htmlContent, {
      waitUntil: ['domcontentloaded', 'networkidle2'],
      timeout: 6000, // 6 second timeout for entire page load
    })

    // Wait an additional 1 second for any final rendering
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Generate screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    })

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

    if (browser) {
      await browser.close()
    }

    // Fallback to a simple error response
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
