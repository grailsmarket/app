export const MARKETPLACE_OPENABLE_FILTERS = ['Status', 'Type', 'Length', 'Price Range', 'Activity', 'Sort'] as const

export const MARKETPLACE_TYPE_FILTER_LABELS = ['Letters', 'Numbers', 'Emojis'] as const

export const MARKETPLACE_STATUS_FILTER_LABELS = [
  'Listed',
  'Premium',
  // 'Available',
  // 'Unlisted',
  'Expiring Soon',
  'Has Last Sale',
] as const

export const MARKETPLACE_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MARKETPLACE_STATUS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  // Available: 'available',
  // Unlisted: 'unlisted',
  Premium: 'premium',
  'Expiring Soon': 'expiring',
  'Has Last Sale': 'has_last_sale',
}

export const MARKETPLACE_SORT_FILTERS = [
  // 'alphabetical_asc',
  // 'alphabetical_desc',
  // 'last_sale_price_asc',
  'last_sale_price_desc',
  'last_sale_date_asc',
  'last_sale_date_desc',
  'price_desc',
  'price_asc',
  'offer_asc',
  'offer_desc',
  'expiry_date_asc',
  // 'expiry_date_desc',
]

export const OFFERS_STATUS_FILTER_LABELS = ['Listed', 'Has Offers'] as const

export const YOUR_DOMAINS_FILTER_LABELS = ['Listed', 'Expiring Soon'] as const

export const PORTFOLIO_ACTIVITY_FILTER_LABELS = ['Sale', 'Transfer', 'Offer', 'Mint', 'Listing'] as const

export const ALL_SORT_FILTERS = [
  // 'alphabetical_asc',
  // 'alphabetical_desc',
  'price_desc',
  'price_asc',
  'offer_asc',
  'offer_desc',
  // 'last_sale_price_asc',
  'last_sale_price_desc',
  'last_sale_date_asc',
  'last_sale_date_desc',
  'expiry_date_asc',
  // 'expiry_date_desc',
] as const

export const SORT_FILTER_LABELS = {
  // alphabetical_asc: 'Alphabetical (A-Z)',
  // alphabetical_desc: 'Alphabetical (Z-A)',
  // last_sale_price_asc: 'Last Sale Price (Low to High)',
  last_sale_price_desc: 'Last Sale Price (High to Low)',
  last_sale_date_asc: 'Last Sale Date (Old to New)',
  last_sale_date_desc: 'Last Sale Date (New to Old)',
  price_desc: 'Price (High to Low)',
  price_asc: 'Price (Low to High)',
  offer_asc: 'Offer (Low to High)',
  offer_desc: 'Offer (High to Low)',
  expiry_date_asc: 'Expiration Date (Soonest First)',
  // expiry_date_desc: 'Expiration Date (Latest First)',
}
