export const MARKETPLACE_OPENABLE_FILTERS = ['Status', 'Type', 'Length', 'Price Range', 'Activity', 'Sort'] as const

export const MARKETPLACE_TYPE_FILTER_LABELS = ['Letters', 'Digits', 'Emojis', 'Repeating'] as const

export const MARKETPLACE_TYPE_FILTER_PARAM_OPTIONS: Record<string, string> = {
  Letters: 'letters',
  Digits: 'digits',
  Emojis: 'emojis',
  'Repeating Characters': 'repeatingChars',
}

export const MARKETPLACE_STATUS_FILTER_LABELS = [
  'Listed',
  'Unlisted',
  'Expiring Soon',
  'Premium',
  'Available',
  'Has Last Sale',
  'Has Offers',
] as const

export const MARKETPLACE_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MARKETPLACE_STATUS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  Unlisted: 'unlisted',
  'Expiring Soon': 'grace',
  Premium: 'premium',
  Available: 'available',
  'Has Last Sale': 'has_last_sale',
  'Has Offers': 'has_offers',
}

export const MARKETPLACE_SORT_FILTERS = [
  // 'alphabetical_asc',
  // 'alphabetical_desc',
  // 'last_sale_price_asc',
  // 'last_sale_price_desc',
  // 'last_sale_date_asc',
  // 'last_sale_date_desc',
  'price_desc',
  'price_asc',
  // 'offer_asc',
  // 'offer_desc',
  'expiry_date_asc',
  // 'expiry_date_desc',
]

export const OFFERS_STATUS_FILTER_LABELS = ['Listed', 'Has Offers'] as const

export const YOUR_DOMAINS_FILTER_LABELS = ['Listed', 'Unlisted', 'Expiring Soon'] as const

export const PORTFOLIO_ACTIVITY_FILTER_LABELS = ['Sale', 'Transfer', 'Offer', 'Mint', 'Listing'] as const

export const ALL_SORT_FILTERS = [
  'alphabetical_asc',
  'alphabetical_desc',
  'price_asc',
  'price_desc',
  'last_sale_price_asc',
  'last_sale_price_desc',
  'last_sale_date_asc',
  'last_sale_date_desc',
  'expiry_date_asc',
  'expiry_date_desc',
] as const

// Sort types for the dropdown (without direction)
export const SORT_TYPES = ['alphabetical', 'price', 'last_sale_price', 'last_sale_date', 'expiry_date'] as const

export type SortType = (typeof SORT_TYPES)[number]

export const SORT_TYPE_LABELS: Record<SortType, string> = {
  alphabetical: 'Alphabetical',
  price: 'Price',
  last_sale_price: 'Last Sale Price',
  last_sale_date: 'Last Sale Date',
  expiry_date: 'Expiration',
}

export const SORT_FILTER_LABELS = {
  alphabetical_asc: 'Alphabetical (A-Z)',
  alphabetical_desc: 'Alphabetical (Z-A)',
  last_sale_price_asc: 'Last Sale Price (Low to High)',
  last_sale_price_desc: 'Last Sale Price (High to Low)',
  last_sale_date_asc: 'Last Sale Date (Old to New)',
  last_sale_date_desc: 'Last Sale Date (New to Old)',
  price_desc: 'Price (High to Low)',
  price_asc: 'Price (Low to High)',
  offer_asc: 'Offer (Low to High)',
  offer_desc: 'Offer (High to Low)',
  expiry_date_asc: 'Expiration Date (Soonest First)',
  expiry_date_desc: 'Expiration Date (Latest First)',
}
