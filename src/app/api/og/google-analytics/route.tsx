import { ImageResponse } from 'next/og'
import { NextRequest, NextResponse } from 'next/server'
import { APP_ENS_ADDRESS } from '@/constants'
import { ENS_NAME_WRAPPER_ADDRESS } from '@/constants/web3/contracts'
import { labelhash, namehash, isAddress } from 'viem'
import { truncateAddress as truncateAddr, fetchAccount } from 'ethereum-identity-kit/utils'
import { beautifyName } from '@/lib/ens'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { fetchKeywordMetrics } from '@/api/domains/fetchKeywordMetrics'
import { toSteppedPercent } from '@/utils/metrics'
import { getInterFonts } from '../_lib/inter'

const size = {
  width: 1600,
  height: 836,
}
const ENS_METADATA_URL = process.env.ENS_METADATA_URL || 'https://ens-metadata-flarecloud.encrypted-063.workers.dev'
const WRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${ENS_NAME_WRAPPER_ADDRESS}`
const UNWRAPPED_DOMAIN_IMAGE_URL = `${ENS_METADATA_URL}/mainnet/${APP_ENS_ADDRESS}`

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

type MonthlyDatum = { month: string; year: number; searches: number }

function TrendChart({
  monthlyTrend,
  avgMonthlySearches,
}: {
  monthlyTrend: MonthlyDatum[]
  avgMonthlySearches: number | null
}) {
  if (!monthlyTrend || monthlyTrend.length === 0) return null

  const sorted = [...monthlyTrend].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return (MONTH_TO_INDEX[a.month.toUpperCase()] ?? 0) - (MONTH_TO_INDEX[b.month.toUpperCase()] ?? 0)
  })

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
    x: margin.left + (n === 1 ? w / 2 : (i / (n - 1)) * w),
    y: margin.top + h - (d.searches / maxVal) * h,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath =
    linePath +
    ` L ${points[n - 1].x.toFixed(1)} ${(margin.top + h).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(margin.top + h).toFixed(1)} Z`

  const tierPercent = toSteppedPercent(avgMonthlySearches ?? 0, 1_000_000) / 100
  const strokeOpacity = 0.25 + tierPercent * 0.55
  const fillOpacity = 0.1 + tierPercent * 0.15

  const first = sorted[0]
  const last = sorted[n - 1]
  const firstLabel = `${first.month.slice(0, 3).charAt(0).toUpperCase()}${first.month.slice(1, 3).toLowerCase()} ${first.year}`
  const lastLabel = `${last.month.slice(0, 3).charAt(0).toUpperCase()}${last.month.slice(1, 3).toLowerCase()} ${last.year}`

  const yearDividers: { xMid: number; year: number }[] = []
  for (let i = 1; i < n; i++) {
    if (sorted[i].year !== sorted[i - 1].year && sorted[i].year !== 2026) {
      yearDividers.push({ xMid: (points[i - 1].x + points[i].x) / 2, year: sorted[i].year })
    }
  }

  const labelTop = margin.top + h + 6
  const yearLabelHalfWidth = 32

  return (
    <div style={{ position: 'relative', display: 'flex', width: chartWidth, height: chartHeight, marginTop: 8 }}>
      <svg width={chartWidth} height={chartHeight} xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <linearGradient
            id='chartGrad'
            x1={0}
            y1={margin.top + h}
            x2={0}
            y2={margin.top}
            gradientUnits='userSpaceOnUse'
          >
            <stop offset='0%' stopColor='#ffdfc0' stopOpacity={0.02} />
            <stop offset='100%' stopColor='#ffdfc0' stopOpacity={fillOpacity} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill='url(#chartGrad)' />
        <path d={linePath} fill='none' stroke='#ffdfc0' strokeOpacity={strokeOpacity} strokeWidth={2} />
        {yearDividers.map((d, i) => (
          <line
            key={i}
            x1={d.xMid}
            x2={d.xMid}
            y1={margin.top}
            y2={margin.top + h}
            stroke='#999'
            strokeOpacity={0.3}
            strokeWidth={1}
            strokeDasharray='4 4'
          />
        ))}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: margin.left,
          top: labelTop,
          display: 'flex',
          fontSize: 24,
          color: '#999',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {firstLabel}
      </div>
      <div
        style={{
          position: 'absolute',
          right: margin.right,
          top: labelTop,
          display: 'flex',
          fontSize: 24,
          color: '#999',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {lastLabel}
      </div>
      {yearDividers.map((d, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: d.xMid - yearLabelHalfWidth,
            top: labelTop,
            width: yearLabelHalfWidth * 2,
            display: 'flex',
            justifyContent: 'center',
            fontSize: 24,
            color: '#999',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {d.year}
        </div>
      ))}
    </div>
  )
}

// Stat-card inner width = 282 (flex:1 of 910 with two 32px gaps) - 3 (border-left) - 16 (padding-left) = 263
const STAT_INNER_WIDTH = 263

function StatCard({
  value,
  label,
  fillPercent,
  fillOpacity,
}: {
  value: string
  label: string
  fillPercent: number
  fillOpacity: number
}) {
  const innerWidth = Math.max(0, Math.min(100, fillPercent)) * (STAT_INNER_WIDTH / 100)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        gap: 6,
        borderLeft: '3px solid #999',
        paddingLeft: 16,
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 700, color: '#f4f4f4' }}>{value}</div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#999' }}>{label}</div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          height: 14,
          width: STAT_INNER_WIDTH,
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          overflow: 'hidden',
          marginTop: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: innerWidth,
            borderRadius: 4,
            opacity: fillOpacity,
            background: 'linear-gradient(to right, #999, #ffdfc0)',
          }}
        />
      </div>
    </div>
  )
}

export async function GET(req: NextRequest) {
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

    const getENSImage = async () => {
      try {
        const nameHash = namehash(displayName)
        const labelHash = labelhash(displayName.replace('.eth', ''))

        const wrappedUrl = `${WRAPPED_DOMAIN_IMAGE_URL}/${nameHash}/image`
        const unwrappedUrl = `${UNWRAPPED_DOMAIN_IMAGE_URL}/${labelHash}/image`

        const wrappedOk = await fetch(wrappedUrl)
          .then((res) => res.ok)
          .catch(() => false)

        return wrappedOk ? wrappedUrl : unwrappedUrl
      } catch (error) {
        console.error('Error fetching ENS image:', error)
        return null
      }
    }

    const getGoogleAnalyticsData = async () => {
      const result = await fetchKeywordMetrics({ keyword: name.replace('.eth', '') })
      if (typeof result === 'string') return null
      return result
    }

    // Sniff the image format from the actual bytes. The `content-type` header often
    // lies (wrong type, extra params like `; charset=...`), and Satori's decoder will
    // throw `RangeError: Offset is outside the bounds of the DataView` if the MIME in
    // the data URI prefix doesn't match the bytes.
    const detectImageMime = (bytes: Uint8Array): string | null => {
      if (bytes.length < 4) return null
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png'
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif'
      if (
        bytes.length >= 12 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      )
        return 'image/webp'
      const head = new TextDecoder()
        .decode(bytes.slice(0, Math.min(bytes.length, 256)))
        .trimStart()
        .toLowerCase()
      if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml'
      return null
    }

    const fetchImageAsDataUri = async (url: string): Promise<string | null> => {
      try {
        const res = await fetch(url)
        if (!res.ok) return null
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength === 0) return null
        const mime = detectImageMime(new Uint8Array(buffer))
        if (!mime) return null
        const base64 = Buffer.from(buffer).toString('base64')
        return `data:${mime};base64,${base64}`
      } catch {
        return null
      }
    }

    const getCategoryAvatarDataUri = async (): Promise<string | null> => {
      if (categories.length !== 1) return null
      return fetchImageAsDataUri(`https://api.grails.app/api/v1/clubs/${categories[0]}/avatar`)
    }

    const [ownerProfile, ensImage, googleAnalyticsData, categoryAvatarDataUri, defaultAvatarDataUri, interFonts] =
      await Promise.all([
        getOwnerProfile(),
        getENSImage(),
        getGoogleAnalyticsData(),
        getCategoryAvatarDataUri(),
        fetchImageAsDataUri(defaultAvatar),
        getInterFonts(),
      ])

    const ownerAvatarDataUri = ownerProfile.displayName
      ? await fetchImageAsDataUri(`${ENS_METADATA_URL}/mainnet/avatar/${ownerProfile.displayName}`)
      : null
    const ownerAvatar = ownerAvatarDataUri || defaultAvatarDataUri

    const hasCategories = categories.length > 0
    const avgSearches = googleAnalyticsData?.avgMonthlySearches
    const avgSearchesDisplay = avgSearches != null ? formatNumber(avgSearches) : 'N/A'
    const avgCpc = googleAnalyticsData?.avgCpc
    const avgCpcDisplay = avgCpc != null ? `$${avgCpc.toFixed(2)}` : 'N/A'
    const monthCount = googleAnalyticsData?.monthlyTrend?.length ?? 0
    const yearlyTotal =
      monthCount > 0
        ? Math.round((googleAnalyticsData!.monthlyTrend.reduce((sum, p) => sum + p.searches, 0) / monthCount) * 12)
        : 0
    const yearlyDisplay = yearlyTotal > 0 ? formatNumber(yearlyTotal) : 'N/A'

    const monthlyFillPercent = toSteppedPercent(avgSearches ?? 0, 1_000_000)
    const yearlyFillPercent = toSteppedPercent(yearlyTotal, 12_000_000)
    const cpcFillPercent = toSteppedPercent(Math.max((avgCpc ?? 0) - 0.1, 0), 4.9)

    const monthlyFillOpacity = 0.72 + Math.min(monthlyFillPercent / 100, 1) * 0.28
    const yearlyFillOpacity = 0.72 + Math.min(yearlyFillPercent / 100, 1) * 0.28
    const cpcFillOpacity = 0.72 + Math.min(cpcFillPercent / 100, 1) * 0.28

    const hasData = googleAnalyticsData != null && (avgSearches != null || avgCpc != null)
    const hasChart = (googleAnalyticsData?.monthlyTrend?.length ?? 0) > 0
    const firstCategoryLabel = hasCategories
      ? CATEGORY_LABELS[categories[0] as keyof typeof CATEGORY_LABELS] || categories[0]
      : ''
    const imageBottomLeftRadius = hasCategories ? 0 : 20

    // dynamic component sizes
    const detailsContainerWidth = hasCategories ? 1460 : 1520
    const imageHeight = hasCategories ? 480 : 568
    const imageWidth = hasCategories ? 480 : 548

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, #444444, #222222)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 60,
            fontFamily: 'Inter, sans-serif',
            color: '#f4f4f4',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-start',
              width: detailsContainerWidth,
              height: 568,
              gap: 36,
              borderRadius: 20,
              overflow: 'hidden',
              backgroundColor: '#444444',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ensImage && (
                <img
                  src={ensImage}
                  alt='ENS Image'
                  width={imageWidth}
                  height={imageHeight}
                  style={{
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 0,
                    borderBottomLeftRadius: imageBottomLeftRadius,
                    borderBottomRightRadius: 0,
                    objectFit: 'cover',
                  }}
                />
              )}
              {categories.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 480,
                    gap: 16,
                    overflow: 'hidden',
                    backgroundColor: '#333333',
                    borderRadius: '0px 0px 0px 20px',
                    padding: categories.length === 1 ? 16 : 10,
                  }}
                >
                  {categories.length === 1 ? (
                    <div
                      key={categories[0]}
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                      }}
                    >
                      {categoryAvatarDataUri && (
                        <img
                          src={categoryAvatarDataUri}
                          alt='category'
                          width={64}
                          height={64}
                          style={{ borderRadius: 32, objectFit: 'cover' }}
                        />
                      )}
                      <div
                        style={{
                          fontSize: 42,
                          color: '#ffffff',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {firstCategoryLabel}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 42, color: '#ffffff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {`${categories.length} Categories`}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 860,
              }}
            >
              {hasData ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    gap: 24,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      fontSize: 56,
                      fontWeight: 600,
                      color: '#ffffff',
                      marginBottom: 12,
                    }}
                  >
                    Google Metrics
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 32, width: 910 }}>
                    <StatCard
                      value={avgSearchesDisplay}
                      label='Monthly Searches'
                      fillPercent={monthlyFillPercent}
                      fillOpacity={monthlyFillOpacity}
                    />
                    <StatCard
                      value={yearlyDisplay}
                      label='Yearly Average'
                      fillPercent={yearlyFillPercent}
                      fillOpacity={yearlyFillOpacity}
                    />
                    <StatCard
                      value={avgCpcDisplay}
                      label='Avg CPC'
                      fillPercent={cpcFillPercent}
                      fillOpacity={cpcFillOpacity}
                    />
                  </div>
                  {hasChart && (
                    <TrendChart
                      monthlyTrend={googleAnalyticsData!.monthlyTrend}
                      avgMonthlySearches={googleAnalyticsData!.avgMonthlySearches}
                    />
                  )}
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    fontSize: 48,
                    color: '#999',
                    fontWeight: 500,
                    padding: '80px 0',
                  }}
                >
                  No search data available
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: detailsContainerWidth - 20,
              gap: 24,
            }}
          >
            {ownerProfile.displayName ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  width: 530,
                  padding: '8px 0px',
                }}
              >
                {ownerAvatar && (
                  <img
                    src={ownerAvatar}
                    alt='owner'
                    width={80}
                    height={80}
                    style={{ borderRadius: 40, objectFit: 'cover' }}
                  />
                )}
                <div
                  style={{
                    fontSize: 48,
                    width: 430,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ownerProfile.displayName}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', width: 530 }} />
            )}
            <img
              src='https://grails.app/logo-w-text.svg'
              alt='Grails'
              width={320}
              height={98}
              style={{ marginTop: 16 }}
            />
            <div
              style={{
                fontSize: 44,
                color: '#ffdfc0',
                width: 530,
                display: 'flex',
                textAlign: 'right',
                justifyContent: 'flex-end',
              }}
            >
              <p
                style={{
                  width: 530,
                  textAlign: 'right',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
              >{`grails.app/${beautifyName(name)}`}</p>
            </div>
          </div>
        </div>
      ),
      {
        ...size,
        emoji: 'twemoji',
        fonts: interFonts,
        headers: {
          'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
        },
      }
    )
  } catch (error) {
    console.error('Error generating google analytics image:', error)
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
  }
}
