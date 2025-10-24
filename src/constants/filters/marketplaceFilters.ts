export const MARKETPLACE_OPENABLE_FILTERS = ['Status', 'Type', 'Length', 'Price Range', 'Activity'] as const

export const MARKETPLACE_TYPE_FILTER_LABELS = ['Letters', 'Numbers', 'Emojis'] as const

export const MARKETPLACE_STATUS_FILTER_LABELS = ['Listed', 'Premium', 'Available', 'Unlisted', 'Expiring Soon'] as const

export const MARKETPLACE_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MARKETPLACE_STATUS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  Available: 'available',
  Unlisted: 'unlisted',
  Premium: 'premium',
  'Expiring Soon': 'expiring',
}

export const MARKETPLACE_SORT_FILTERS = [
  'alphabetical',
  'most_favorited',
  'highest_last_sale',
  'price_low_to_high',
  'price_high_to_low',
]

export const OFFERS_STATUS_FILTER_LABELS = ['Listed', 'Has Offers'] as const

export const YOUR_DOMAINS_FILTER_LABELS = ['Listed', 'Expiring Soon'] as const

export const PORTFOLIO_ACTIVITY_FILTER_LABELS = ['Sale', 'Transfer', 'Offer', 'Mint', 'Listing'] as const

export const ALL_SORT_FILTERS = [
  'alphabetical',
  'alphabetical_desc',
  'most_favorited',
  'highest_last_sale',
  'lowest_last_sale',
  'price_low_to_high',
  'price_high_to_low',
  'highest_offer',
  'highest_offer_desc',
] as const
