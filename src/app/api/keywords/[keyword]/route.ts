import { NextRequest, NextResponse } from 'next/server'

const API_URL = 'https://api.grails.app/api/v1'

// Bounded FIFO cache — evicts oldest entry when full to prevent unbounded growth
const MAX_CACHE_SIZE = 500
const cache = new Map<string, { data: KeywordMetricsResponse; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000

// Sliding window rate limiter — 30 requests per minute per IP
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 60 * 1000
const MAX_RATE_LIMIT_IPS = 10_000
const rateLimitMap = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX) {
    rateLimitMap.set(ip, recent)
    return true
  }

  recent.push(now)

  // Evict oldest IP entry when map is full to prevent unbounded growth
  if (!rateLimitMap.has(ip) && rateLimitMap.size >= MAX_RATE_LIMIT_IPS) {
    const firstKey = rateLimitMap.keys().next().value
    if (firstKey) rateLimitMap.delete(firstKey)
  }

  rateLimitMap.set(ip, recent)
  return false
}

interface MonthlyVolume {
  month: string
  year: string
  monthlySearches: string
}

interface KeywordMetricsResponse {
  avgMonthlySearches: number | null
  monthlyTrend: { month: string; year: number; searches: number }[]
  relatedKeywordCount: number
  competition: string | null
}

async function getAccessToken(): Promise<string> {
  if (
    !process.env.GOOGLE_ADS_DEVELOPER_TOKEN ||
    !process.env.GOOGLE_ADS_CLIENT_ID ||
    !process.env.GOOGLE_ADS_CLIENT_SECRET ||
    !process.env.GOOGLE_ADS_REFRESH_TOKEN ||
    !process.env.GOOGLE_ADS_CUSTOMER_ID
  ) {
    throw new Error('Missing Google Ads API credentials')
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`Token error: ${data.error_description}`)
  }
  return data.access_token
}

const GOOGLE_MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

function getTrailing12MonthRange() {
  const now = new Date()
  // End: last month (most recent complete month)
  const end = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  // Start: 23 months before end = 24 months total
  const start = new Date(end.getFullYear(), end.getMonth() - 23, 1)
  return {
    start: { year: start.getFullYear(), month: GOOGLE_MONTH_NAMES[start.getMonth()] },
    end: { year: end.getFullYear(), month: GOOGLE_MONTH_NAMES[end.getMonth()] },
  }
}

async function getKeywordHistoricalMetrics(
  keyword: string,
  accessToken: string
): Promise<{ avgMonthlySearches: number | null; monthlyTrend: MonthlyVolume[]; competition: string | null }> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!

  const response = await fetch(
    `https://googleads.googleapis.com/v22/customers/${customerId}:generateKeywordHistoricalMetrics`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keywords: [keyword],
        keywordPlanNetwork: 'GOOGLE_SEARCH',
        historicalMetricsOptions: {
          yearMonthRange: getTrailing12MonthRange(),
        },
      }),
    }
  )

  const data = await response.json()

  if (data.error) {
    console.error('Google Ads API error (metrics):', data.error?.message ?? data.error)
    return { avgMonthlySearches: null, monthlyTrend: [], competition: null }
  }

  const result = data.results?.[0]
  const metrics = result?.keywordMetrics || {}
  const rawVolumes = metrics.monthlySearchVolumes

  // Validate response shape before mapping to avoid silent NaN
  const monthlyTrend: MonthlyVolume[] = Array.isArray(rawVolumes)
    ? rawVolumes.filter(
        (m: unknown): m is MonthlyVolume =>
          typeof m === 'object' && m !== null &&
          typeof (m as MonthlyVolume).month === 'string' &&
          typeof (m as MonthlyVolume).year === 'string' &&
          typeof (m as MonthlyVolume).monthlySearches === 'string'
      )
    : []

  return {
    avgMonthlySearches: metrics.avgMonthlySearches ? parseInt(metrics.avgMonthlySearches) : null,
    monthlyTrend,
    competition: metrics.competition || null,
  }
}

async function getRelatedKeywordCount(keyword: string, accessToken: string): Promise<number> {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID!
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!

  const response = await fetch(`https://googleads.googleapis.com/v22/customers/${customerId}:generateKeywordIdeas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      keywordSeed: { keywords: [keyword] },
      keywordPlanNetwork: 'GOOGLE_SEARCH',
    }),
  })

  const data = await response.json()

  if (data.error) {
    console.error('Google Ads API error (ideas):', data.error?.message ?? data.error)
    return 0
  }

  return data.results?.length || 0
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ keyword: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authResponse = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })
    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { keyword } = await params

    let decodedKeyword: string
    try {
      decodedKeyword = decodeURIComponent(keyword).toLowerCase().trim()
    } catch {
      return NextResponse.json({ error: 'Invalid keyword' }, { status: 400 })
    }

    if (!decodedKeyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }
    if (decodedKeyword.length > 20) {
      return NextResponse.json({ error: 'Keyword must be 20 characters or fewer' }, { status: 400 })
    }

    const range = getTrailing12MonthRange()
    const cacheKey = `${decodedKeyword}:${range.start.year}-${range.start.month}:${range.end.year}-${range.end.month}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    const accessToken = await getAccessToken()

    const [metricsResult, relatedCount] = await Promise.all([
      getKeywordHistoricalMetrics(decodedKeyword, accessToken),
      getRelatedKeywordCount(decodedKeyword, accessToken),
    ])

    const monthlyTrend = metricsResult.monthlyTrend.map((m: MonthlyVolume) => ({
      month: m.month,
      year: parseInt(m.year),
      searches: parseInt(m.monthlySearches) || 0,
    }))

    if (process.env.NODE_ENV === 'development') {
      console.log('[keywords] monthlyTrend for', decodedKeyword, monthlyTrend.map((m) => `${m.month} ${m.year}`))
    }

    const responseData: KeywordMetricsResponse = {
      avgMonthlySearches: metricsResult.avgMonthlySearches,
      monthlyTrend,
      relatedKeywordCount: relatedCount,
      competition: metricsResult.competition,
    }

    if (cache.size >= MAX_CACHE_SIZE) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'Missing Google Ads API credentials') {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 })
    }
    console.error('Error fetching keyword metrics:', message)
    return NextResponse.json({ error: 'Failed to fetch keyword metrics' }, { status: 500 })
  }
}
