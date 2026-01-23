export type DomainAnalyticsEventsType =
  | 'sale'
  | 'purchase'
  | 'offer'
  | 'listing'
  | 'registration'
  | 'premium_registration'
  | 'transfer'

export type DomainAnalyticsEventEventsType = {
  label: string
  value: DomainAnalyticsEventsType | null
}

export type DomainAnalyticsEventType = {
  asset: string | null
  domain: string
  end_time: number | null
  event_type: DomainAnalyticsEventsType
  from_addr: string
  price: string | null
  start_time: number
  taxonomies: string[] | null
  terms: string[] | null
  to_addr: string | null
}

export type DomainAnalyticsAggregationType = {
  price_avg: string
  price_max: string
  price_cnt: number
  price_sum: string
  timestamp: number
}

// Analytics page types
export type AnalyticsPeriod = '24h' | '7d' | '30d' | '1y' | 'all'
export type AnalyticsSource = 'all' | 'grails' | 'opensea'

export interface AnalyticsListing {
  id: number
  name: string
  price_wei: string
  currency_address: string
  seller_address: string
  source: string
  created_at: string
  clubs: string[] | null
}

export interface AnalyticsOffer {
  id: number
  name: string
  offer_amount_wei: string
  currency_address: string
  buyer_address: string
  source: string
  created_at: string
  clubs: string[] | null
}

export interface AnalyticsSale {
  id: number
  name: string
  sale_price_wei: string
  currency_address: string
  seller_address: string
  buyer_address: string
  source: string
  sale_date: string
  clubs: string[] | null
}

export interface ChartDataPoint {
  date: string
  total: number
  grails: number
  opensea: number
}

export interface AnalyticsListingsResponse {
  success: boolean
  data: {
    results: AnalyticsListing[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export interface AnalyticsOffersResponse {
  success: boolean
  data: {
    results: AnalyticsOffer[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export interface AnalyticsSalesResponse {
  success: boolean
  data: {
    results: AnalyticsSale[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export interface ChartResponse {
  success: boolean
  data: {
    period: string
    club: string | null
    points: ChartDataPoint[]
  }
}
