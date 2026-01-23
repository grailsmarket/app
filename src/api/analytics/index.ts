import { API_BASE_URL } from '@/constants/analytics'
import {
  AnalyticsPeriod,
  AnalyticsSource,
  AnalyticsListingsResponse,
  AnalyticsOffersResponse,
  AnalyticsSalesResponse,
  ChartResponse,
} from '@/types/analytics'

interface FetchTopItemsParams {
  period: AnalyticsPeriod
  source: AnalyticsSource
}

export const fetchTopListings = async ({ period, source }: FetchTopItemsParams): Promise<AnalyticsListingsResponse> => {
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

  const response = await fetch(`${API_BASE_URL}/analytics/listings?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top listings')
  }

  return response.json()
}

export const fetchTopOffers = async ({ period, source }: FetchTopItemsParams): Promise<AnalyticsOffersResponse> => {
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

  const response = await fetch(`${API_BASE_URL}/analytics/offers?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top offers')
  }

  return response.json()
}

export const fetchTopSales = async ({ period, source }: FetchTopItemsParams): Promise<AnalyticsSalesResponse> => {
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

  const response = await fetch(`${API_BASE_URL}/analytics/sales?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch top sales')
  }

  return response.json()
}

interface FetchChartParams {
  period: AnalyticsPeriod
}

export const fetchListingsChart = async ({ period }: FetchChartParams): Promise<ChartResponse> => {
  const response = await fetch(`${API_BASE_URL}/charts/listings?period=${period}`)

  if (!response.ok) {
    throw new Error('Failed to fetch listings chart data')
  }

  return response.json()
}

export const fetchOffersChart = async ({ period }: FetchChartParams): Promise<ChartResponse> => {
  const response = await fetch(`${API_BASE_URL}/charts/offers?period=${period}`)

  if (!response.ok) {
    throw new Error('Failed to fetch offers chart data')
  }

  return response.json()
}

export const fetchSalesChart = async ({ period }: FetchChartParams): Promise<ChartResponse> => {
  const response = await fetch(`${API_BASE_URL}/charts/sales?period=${period}`)

  if (!response.ok) {
    throw new Error('Failed to fetch sales chart data')
  }

  return response.json()
}
