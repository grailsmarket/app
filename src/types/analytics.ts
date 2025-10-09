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
