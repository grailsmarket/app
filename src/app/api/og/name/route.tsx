import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash } from 'viem'
import puppeteerCore from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'

// Configure for Node.js runtime (required for Puppeteer)
export const runtime = 'nodejs'

const size = {
  width: 800,
  height: 418,
}

export const WRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
export const UNWRAPPED_DOMAIN_IMAGE_URL = `https://metadata.ens.domains/mainnet/${APP_ENS_ADDRESS}`

async function getBrowser() {
  const REMOTE_PATH = process.env.CHROMIUM_REMOTE_EXEC_PATH
  const LOCAL_PATH = process.env.CHROMIUM_LOCAL_EXEC_PATH

  if (!REMOTE_PATH && !LOCAL_PATH) {
    throw new Error('Missing a path for Chromium executable')
  }

  if (REMOTE_PATH) {
    // ✅ Use the remote tarball (for Vercel)
    return await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(REMOTE_PATH),
      defaultViewport: { width: size.width, height: size.height },
      headless: true,
    })
  }

  // ✅ Local fallback (for dev)
  return await puppeteerCore.launch({
    executablePath: LOCAL_PATH,
    headless: true,
  })
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

  // Launch Puppeteer browser with environment detection
  // const isVercel = !!process.env.VERCEL_ENV
  // let launchOptions: any = {
  //   headless: true,
  // }

  // if (isVercel) {
  //   try {
  //     launchOptions = {
  //       ...launchOptions,
  //       args: chromium.args,
  //       executablePath: await chromium.executablePath(),
  //       headless: true,
  //     }
  //   } catch (error) {
  //     console.error('Chromium failed to load, falling back to @vercel/og:', error)
  //     // Fall back to @vercel/og approach
  //     return await generateSimpleImage(ensSVG, displayName)
  //   }
  // } else {
  //   launchOptions = {
  //     ...launchOptions,
  //     args: [
  //       '--no-sandbox',
  //       '--disable-setuid-sandbox',
  //       '--disable-dev-shm-usage',
  //       '--disable-gpu',
  //       '--disable-web-security',
  //       '--disable-features=VizDisplayCompositor',
  //       '--run-all-compositor-stages-before-draw',
  //       '--disable-background-timer-throttling',
  //       '--disable-renderer-backgrounding',
  //       '--disable-backgrounding-occluded-windows',
  //       '--disable-ipc-flooding-protection',
  //     ],
  //     executablePath: process.env.CHROME_BIN || undefined,
  //   }
  // }

  let browser
  try {
    browser = await getBrowser()
    const page = await browser.newPage()
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
      timeout: 10000,
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

// Fallback function using @vercel/og when Puppeteer fails
async function generateSimpleImage(ensSVG: string | null, displayName: string) {
  const { ImageResponse } = await import('@vercel/og')

  // Extract text from SVG if available
  let extractedText = displayName
  let backgroundColor = '#5298FF'

  if (ensSVG) {
    const textMatch = ensSVG.match(/<text[^>]*>([^<]*)<\/text>/)
    if (textMatch && textMatch[1]) {
      extractedText = textMatch[1].trim()
    }

    const bgColorMatch = ensSVG.match(/fill="([^"]*)"/)
    if (bgColorMatch && bgColorMatch[1] && bgColorMatch[1] !== 'none') {
      backgroundColor = bgColorMatch[1]
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '36px',
          background: 'radial-gradient(circle, #444444, #222222)',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: '#f4f4f4',
        }}
      >
        <div
          style={{
            width: '300px',
            height: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: backgroundColor,
            borderRadius: '12px',
            fontSize: '32px',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          {extractedText}
        </div>

        <div
          style={{
            height: '80px',
            width: '2px',
            backgroundColor: '#ffffff',
            opacity: 0.3,
          }}
        />

        <img src='https://grails.app/your-ens-market-logo.png' alt='Grails' width='232' height='71' />
      </div>
    ),
    {
      width: 800,
      height: 418,
    }
  )
}
