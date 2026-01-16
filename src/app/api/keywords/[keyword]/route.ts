import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache with 1 hour TTL
const cache = new Map<string, { data: KeywordMetricsResponse; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

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
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(`Token error: ${data.error_description}`)
  }
  return data.access_token
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
        geoTargetConstants: ['geoTargetConstants/2840'], // USA
        language: 'languageConstants/1000', // English
        keywordPlanNetwork: 'GOOGLE_SEARCH',
      }),
    }
  )

  const data = await response.json()

  if (data.error) {
    console.error('Google Ads API error (metrics):', data.error)
    return { avgMonthlySearches: null, monthlyTrend: [], competition: null }
  }

  const result = data.results?.[0]
  const metrics = result?.keywordMetrics || {}

  return {
    avgMonthlySearches: metrics.avgMonthlySearches ? parseInt(metrics.avgMonthlySearches) : null,
    monthlyTrend: metrics.monthlySearchVolumes || [],
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
      geoTargetConstants: ['geoTargetConstants/2840'], // USA
      language: 'languageConstants/1000', // English
      keywordPlanNetwork: 'GOOGLE_SEARCH',
    }),
  })

  const data = await response.json()

  if (data.error) {
    console.error('Google Ads API error (ideas):', data.error)
    return 0
  }

  return data.results?.length || 0
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ keyword: string }> }) {
  try {
    const { keyword } = await params
    const decodedKeyword = decodeURIComponent(keyword).toLowerCase().trim()

    if (!decodedKeyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 })
    }

    // Check cache first
    const cached = cache.get(decodedKeyword)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    // Validate environment variables
    if (
      !process.env.GOOGLE_ADS_DEVELOPER_TOKEN ||
      !process.env.GOOGLE_ADS_CLIENT_ID ||
      !process.env.GOOGLE_ADS_CLIENT_SECRET ||
      !process.env.GOOGLE_ADS_REFRESH_TOKEN ||
      !process.env.GOOGLE_ADS_CUSTOMER_ID
    ) {
      console.error('Missing Google Ads API credentials')
      return NextResponse.json({ error: 'API not configured' }, { status: 500 })
    }

    // Get access token
    const accessToken = await getAccessToken()

    // Fetch both metrics and related keyword count in parallel
    const [metricsResult, relatedCount] = await Promise.all([
      getKeywordHistoricalMetrics(decodedKeyword, accessToken),
      getRelatedKeywordCount(decodedKeyword, accessToken),
    ])

    // Transform monthly trend data
    const monthlyTrend = metricsResult.monthlyTrend.map((m: MonthlyVolume) => ({
      month: m.month,
      year: parseInt(m.year),
      searches: parseInt(m.monthlySearches) || 0,
    }))

    const responseData: KeywordMetricsResponse = {
      avgMonthlySearches: metricsResult.avgMonthlySearches,
      monthlyTrend,
      relatedKeywordCount: relatedCount,
      competition: metricsResult.competition,
    }

    // Cache the result
    cache.set(decodedKeyword, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('Error fetching keyword metrics:', error)
    return NextResponse.json({ error: 'Failed to fetch keyword metrics' }, { status: 500 })
  }
}

