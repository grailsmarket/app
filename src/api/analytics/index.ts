import { API_BASE_URL } from '@/constants/analytics'
import {
  AnalyticsPeriod,
  AnalyticsSource,
  AnalyticsListingsResponse,
  AnalyticsOffersResponse,
  AnalyticsSalesResponse,
  ChartResponse,
  AnalyticsRegistrationsResponse,
  AnalyticsRegistrationsChartResponse,
} from '@/types/analytics'

interface FetchTopItemsParams {
  period: AnalyticsPeriod
  source: AnalyticsSource
  categories: string[] | null
  limit?: number
}

export const fetchTopListings = async ({
  period,
  source,
  categories,
}: FetchTopItemsParams): Promise<AnalyticsListingsResponse> => {
  const params = new URLSearchParams({
    period,
    status: 'active',
    sortBy: 'price',
    sortOrder: 'desc',
    limit: '10',
    page: '1',
  })

  if (source !== 'all') {
    params.append('source', source)
  }

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/analytics/listings?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top listings')
  }

  return response.json()
}

export const fetchTopOffers = async ({
  period,
  source,
  categories,
}: FetchTopItemsParams): Promise<AnalyticsOffersResponse> => {
  const params = new URLSearchParams({
    period,
    status: 'pending',
    sortBy: 'price',
    sortOrder: 'desc',
    limit: '10',
    page: '1',
  })

  if (source !== 'all') {
    params.append('source', source)
  }

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/analytics/offers?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top offers')
  }

  return response.json()
}

export const fetchTopSales = async ({
  period,
  source,
  categories,
}: FetchTopItemsParams): Promise<AnalyticsSalesResponse> => {
  const params = new URLSearchParams({
    period,
    sortBy: 'price',
    sortOrder: 'desc',
    limit: '10',
    page: '1',
  })

  if (source !== 'all') {
    params.append('source', source)
  }

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/analytics/sales?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top sales')
  }

  return response.json()
}

export const fetchTopRegistrations = async ({
  period,
  source,
  categories,
  limit,
}: FetchTopItemsParams): Promise<AnalyticsRegistrationsResponse> => {
  const params = new URLSearchParams({
    period,
    sortBy: 'cost',
    sortOrder: 'desc',
    limit: limit?.toString() || '10',
    page: '1',
  })

  if (source !== 'all') {
    params.append('source', source)
  }

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/analytics/registrations?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top registrations')
  }

  return response.json()
}

interface FetchChartParams {
  period: AnalyticsPeriod
  categories: string[] | null
}

export const fetchListingsChart = async ({ period, categories }: FetchChartParams): Promise<ChartResponse> => {
  const params = new URLSearchParams({
    period: period === '24h' ? '1d' : period,
  })

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/charts/listings?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch listings chart data')
  }

  return response.json()
}

export const fetchOffersChart = async ({ period, categories }: FetchChartParams): Promise<ChartResponse> => {
  const params = new URLSearchParams({
    period: period === '24h' ? '1d' : period,
  })

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/charts/offers?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch offers chart data')
  }

  return response.json()
}

export const fetchSalesChart = async ({ period, categories }: FetchChartParams): Promise<ChartResponse> => {
  const params = new URLSearchParams({
    period: period === '24h' ? '1d' : period,
  })

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/charts/sales?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch sales chart data')
  }

  return response.json()
}

export const fetchRegistrationsChart = async ({ period, categories }: FetchChartParams): Promise<ChartResponse> => {
  const params = new URLSearchParams({
    period: period === '24h' ? '1d' : period,
  })

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/charts/registrations?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch registrations chart data')
  }

  const data = (await response.json()) as AnalyticsRegistrationsChartResponse
  const transformedData = data.data.points.map((point) => ({
    date: point.date,
    total: point.count,
    grails: point.count,
    opensea: point.count,
  }))

  return {
    success: true,
    data: {
      period: data.data.period,
      club: data.data.club,
      points: transformedData,
    },
  }
}

export const fetchVolumeChart = async ({ period, categories }: FetchChartParams): Promise<ChartResponse> => {
  const params = new URLSearchParams({
    period: period === '24h' ? '1d' : period,
  })

  if (categories) {
    params.append('clubs[]', categories.join(','))
  }

  const response = await fetch(`${API_BASE_URL}/charts/volume?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch volume chart data')
  }

  return response.json()
}
