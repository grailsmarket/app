import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash, isAddress } from 'viem'
import puppeteerCore, { LaunchOptions } from 'puppeteer-core'
import chromium from '@sparticuz/chromium-min'
import { truncateAddress as truncateAddr, fetchAccount } from 'ethereum-identity-kit/utils'
import { beautifyName } from '@/lib/ens'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { fetchKeywordMetrics } from '@/api/domains/fetchKeywordMetrics'
import { toSteppedPercent } from '@/utils/metrics'

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

const MONTH_TO_INDEX: Record<string, number> = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
}

const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toLocaleString('en-US')
}

function generateTrendChartSVG(
  monthlyTrend: { month: string; year: number; searches: number }[],
  avgMonthlySearches: number | null
): string {
  if (!monthlyTrend || monthlyTrend.length === 0) return ''

  const sorted = [...monthlyTrend].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return (MONTH_TO_INDEX[a.month.toUpperCase()] ?? 0) - (MONTH_TO_INDEX[b.month.toUpperCase()] ?? 0)
  })

  // Smooth values
  const smoothed = sorted.map((d, i, arr) => {
    const prev = arr[i - 1]?.searches ?? d.searches
    const next = arr[i + 1]?.searches ?? d.searches
    return { ...d, searches: prev * 0.2 + d.searches * 0.6 + next * 0.2 }
  })

  const chartWidth = 910
  const chartHeight = 224
  const margin = { top: 10, right: 10, bottom: 32, left: 10 }
  const w = chartWidth - margin.left - margin.right
  const h = chartHeight - margin.top - margin.bottom

  const n = smoothed.length
  const maxVal = Math.max(...smoothed.map((d) => d.searches), 1)

  const points = smoothed.map((d, i) => ({
    x: margin.left + (i / (n - 1)) * w,
    y: margin.top + h - (d.searches / maxVal) * h,
  }))

  // Build line path (simple polyline)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  // Build area path
  const areaPath =
    linePath +
    ` L ${points[n - 1].x.toFixed(1)} ${(margin.top + h).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(margin.top + h).toFixed(1)} Z`

  const tierPercent = toSteppedPercent(avgMonthlySearches ?? 0, 1_000_000) / 100
  const strokeOpacity = (0.25 + tierPercent * 0.55).toFixed(2)
  const fillOpacity = (0.1 + tierPercent * 0.15).toFixed(2)

  // Axis labels
  const first = sorted[0]
  const last = sorted[n - 1]
  const firstLabel = `${first.month.slice(0, 3).charAt(0).toUpperCase()}${first.month.slice(1, 3).toLowerCase()} ${first.year}`
  const lastLabel = `${last.month.slice(0, 3).charAt(0).toUpperCase()}${last.month.slice(1, 3).toLowerCase()} ${last.year}`

  // Year-change divider
  let yearDivider = ''
  for (let i = 1; i < n; i++) {
    if (sorted[i].year !== sorted[i - 1].year) {
      const xMid = ((points[i - 1].x + points[i].x) / 2).toFixed(1)
      yearDivider += `<line x1="${xMid}" x2="${xMid}" y1="${margin.top}" y2="${margin.top + h}" stroke="#999" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="4,4" />`
      yearDivider += `<text x="${xMid}" y="${margin.top + h + 28}" fill="#999" font-size="24" text-anchor="middle" font-family="Inter, sans-serif">${sorted[i].year}</text>`
    }
  }

  return `
    <svg width="${chartWidth}" height="${chartHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="${margin.top + h}" x2="0" y2="${margin.top}" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ffdfc0" stop-opacity="0.02" />
          <stop offset="100%" stop-color="#ffdfc0" stop-opacity="${fillOpacity}" />
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#chartGrad)" />
      <path d="${linePath}" fill="none" stroke="#ffdfc0" stroke-opacity="${strokeOpacity}" stroke-width="2" />
      ${yearDivider}
      <text x="${margin.left}" y="${margin.top + h + 28}" fill="#999" font-size="24" text-anchor="start" font-family="Inter, sans-serif">${firstLabel}</text>
      <text x="${margin.left + w}" y="${margin.top + h + 28}" fill="#999" font-size="24" text-anchor="end" font-family="Inter, sans-serif">${lastLabel}</text>
    </svg>
  `
}

export async function GET(req: NextRequest) {
  let browser
  let page

  try {
    const searchParams = req.nextUrl.searchParams
    const name = searchParams.get('name')
    const owner_address = searchParams.get('owner')
    const categories = searchParams.get('categories')?.split(',') || []

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

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

    const getGoogleAnalyticsData = async () => {
      const result = await fetchKeywordMetrics({ keyword: name.replace('.eth', '') })
      if (typeof result === 'string') {
        return null
      }
      return result
    }

    // Pre-fetch category avatar as base64 data URI to avoid redirect/CORS issues in Puppeteer
    const getCategoryAvatarDataUri = async (): Promise<string | null> => {
      if (categories.length === 0) return null
      try {
        const res = await fetch(`https://api.grails.app/api/v1/clubs/${categories[0]}/avatar`)
        if (!res.ok) return null
        const buffer = await res.arrayBuffer()
        const contentType = res.headers.get('content-type') || 'image/jpeg'
        const base64 = Buffer.from(buffer).toString('base64')
        return `data:${contentType};base64,${base64}`
      } catch {
        return null
      }
    }

    // Fetch all data in parallel
    const [ownerProfile, ensSVG, googleAnalyticsData, categoryAvatarDataUri] = await Promise.all([
      getOwnerProfile(),
      getENSSVG(),
      getGoogleAnalyticsData(),
      getCategoryAvatarDataUri(),
    ])

    // Pre-compute metrics values
    const avgSearches = googleAnalyticsData?.avgMonthlySearches
    const avgSearchesDisplay = avgSearches != null ? formatNumber(avgSearches) : 'N/A'
    const avgCpc = googleAnalyticsData?.avgCpc
    const avgCpcDisplay = avgCpc != null ? `$${avgCpc.toFixed(2)}` : 'N/A'
    const monthCount = googleAnalyticsData?.monthlyTrend?.length ?? 0
    const yearlyTotal =
      monthCount > 0
        ? Math.round(
          (googleAnalyticsData!.monthlyTrend.reduce((sum, p) => sum + p.searches, 0) / monthCount) * 12
        )
        : 0
    const yearlyDisplay = yearlyTotal > 0 ? formatNumber(yearlyTotal) : 'N/A'

    const monthlyFillPercent = toSteppedPercent(avgSearches ?? 0, 1_000_000)
    const yearlyFillPercent = toSteppedPercent(yearlyTotal, 12_000_000)
    const cpcFillPercent = toSteppedPercent(Math.max((avgCpc ?? 0) - 0.1, 0), 4.9)

    const monthlyFillOpacity = (0.72 + Math.min(monthlyFillPercent / 100, 1) * 0.28).toFixed(2)
    const yearlyFillOpacity = (0.72 + Math.min(yearlyFillPercent / 100, 1) * 0.28).toFixed(2)
    const cpcFillOpacity = (0.72 + Math.min(cpcFillPercent / 100, 1) * 0.28).toFixed(2)

    // Generate chart SVG
    const chartSVG =
      googleAnalyticsData?.monthlyTrend && googleAnalyticsData.monthlyTrend.length > 0
        ? generateTrendChartSVG(googleAnalyticsData.monthlyTrend, googleAnalyticsData.avgMonthlySearches)
        : ''

    const hasData = googleAnalyticsData != null && (avgSearches != null || avgCpc != null)

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
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 20px;
              color: #f4f4f4;
              padding: 60px;
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
            }
            .card {
              width: 1460px;
              height: 568px;
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: flex-start;
              gap: 36px;
              border-radius: 20px;
              overflow: hidden;
              background-color: #444444;
            }
            .ens-image-container {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0px;
              border-radius: 20px 0px 0px 20px;
            }
            .ens-image {
              width: 480px;
              height: 480px;
              display: flex;
              padding: 0;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              flex-shrink: 0;
              border-radius: ${categories.length > 0 ? '0px' : '0px 0px 20px 20px'} !important;
            }
            .ens-image svg {
              width: 480px !important;
              height: 480px !important;
              width: auto;
              height: auto;
              border-radius: ${categories.length > 0 ? '0px' : '0px 0px 20px 20px'} !important;
            }
            .fallback {
              width: 480px;
              height: 480px;
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
              justify-content: center;
              width: 480px;
              gap: 16px;
              overflow-x: scroll;
              background-color: #333;
              border-radius: 0px 0px 0px 20px;
              padding: 12px;
            }
            .category {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: ${categories.length > 1 ? 'flex-start' : 'center'};
              gap: 16px;
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
              font-size: 42px;
              color: #ffffff;
              font-weight: 600;
              white-space: nowrap;
            }
            .category-count {
              font-size: 42px;
              color: #AAA;
              font-weight: 600;
              white-space: nowrap;
            }
            .info {
              display: flex;
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              gap: 24px;
              width: 1420px;
            }
            .analytics-container {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: center;
              gap: 24px;
              width: 860px;
            }
            .analytics-title {
              font-size: 56px;
              font-weight: 600;
              color: #ffffff;
              text-align: left;
              margin-bottom: 12px;
            }
            .stats-grid {
              display: flex;
              flex-direction: row;
              gap: 32px;
              width: 910px;
            }
            .stat-card {
              display: flex;
              flex-direction: column;
              gap: 6px;
              flex: 1;
              border-left: 3px solid #999;
              padding-left: 16px;
            }
            .stat-value {
              font-size: 44px;
              font-weight: 700;
              color: #f4f4f4;
            }
            .stat-label {
              font-size: 32px;
              font-weight: 600;
              color: #999;
            }
            .fill-bar {
              position: relative;
              height: 14px;
              width: 100%;
              background: rgba(255,255,255,0.15);
              border-radius: 4px;
              overflow: hidden;
              margin-top: 4px;
            }
            .fill-bar-inner {
              position: absolute;
              top: 0;
              left: 0;
              bottom: 0;
              border-radius: 4px;
              background: linear-gradient(to right, #999, #ffdfc0);
            }
            .chart-container {
              width: 100%;
              margin-top: 8px;
            }
            .owner {
              display: flex;
              align-items: center;
              gap: 24px;
              margin-top: 8px;
              padding: 8px 0px;
              width: 520px;
            }
            .owner-avatar {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              object-fit: cover;
            }
            .owner-name {
              font-size: 48px;
              width: 420px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .domain-link {
              font-size: 44px;
              color: #ffdfc0;
              width: 520px;
              overflow: hidden;
              text-align: right;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-family: 'Inter', system-ui, -apple-system, sans-serif, 'Noto Color Emoji';
            }
            .grails-logo {
              margin-top: 16px;
              width: 340px;
              height: auto;
            }
            .no-data {
              font-size: 48px;
              color: #999;
              font-weight: 500;
              text-align: center;
              padding: 80px 0;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="ens-image-container">
              <div class="ens-image">
                ${ensSVG ? ensSVG : `<div class="fallback">${displayName}</div>`}
              </div>
              ${categories.length > 0
        ? `<div class="categories">
                        ${categoryAvatarDataUri ? `<img class="category-logo" src="${categoryAvatarDataUri}" alt="category" />` : ''}
                        <p class="category-label">${CATEGORY_LABELS[categories[0] as keyof typeof CATEGORY_LABELS] || categories[0]}</p>
                        ${categories.length > 1 ? `<p class="category-count">+${categories.length - 1}</p>` : ''}
                      </div>`
        : ''
      }
            </div>
            <div class="analytics-container">
              ${hasData
        ? `
        <h2 class="analytics-title">Google Metrics</h2>
                <div class="stats-grid">
                  <div class="stat-card">
                    <p class="stat-value">${avgSearchesDisplay}</p>
                    <p class="stat-label">Monthly Searches</p>
                    <div class="fill-bar">
                      <div class="fill-bar-inner" style="width: ${monthlyFillPercent}%; opacity: ${monthlyFillOpacity};"></div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <p class="stat-value">${yearlyDisplay}</p>
                    <p class="stat-label">Yearly Average</p>
                    <div class="fill-bar">
                      <div class="fill-bar-inner" style="width: ${yearlyFillPercent}%; opacity: ${yearlyFillOpacity};"></div>
                    </div>
                  </div>
                  <div class="stat-card">
                    <p class="stat-value">${avgCpcDisplay}</p>
                    <p class="stat-label">Avg CPC</p>
                    <div class="fill-bar">
                      <div class="fill-bar-inner" style="width: ${cpcFillPercent}%; opacity: ${cpcFillOpacity};"></div>
                    </div>
                  </div>
                </div>
                ${chartSVG ? `<div class="chart-container">${chartSVG}</div>` : ''}
              `
        : '<p class="no-data">No search data available</p>'
      }
            </div>
          </div>
          <div class="info">
            ${ownerProfile.displayName
        ? `<div class="owner">
                    <img class="owner-avatar" src="${ownerProfile.avatar}" alt="owner" />
                    <span class="owner-name">${ownerProfile.displayName}</span>
                  </div>`
        : ''
      }
      <img class="grails-logo" src="https://grails.app/your-ens-market-logo.png" alt="Grails" />
            <p class="domain-link">grails.app/${beautifyName(name)}</p>
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
    console.error('Error generating google analytics image:', error)

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
