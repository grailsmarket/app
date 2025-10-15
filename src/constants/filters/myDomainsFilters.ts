export const MY_DOMAINS_OPENABLE_FILTERS = ['Status', 'Type', 'Length', 'Price Range'] as const

export const MY_DOMAINS_TYPE_FILTER_LABELS = ['Letters', 'Numbers', 'Emojis'] as const

export const MY_DOMAINS_STATUS_FILTER_LABELS = ['Listed', 'Unlisted', 'Expiring Soon'] as const

export const MY_DOMAINS_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MY_DOMAINS_STATUS_PARAM_OPTIONS: Record<string, string> = {
  'Expiring Soon': 'expiring',
}

export const MY_DOMAINS_SORT_FILTERS = [
  'alphabetical',
  'most_favorited',
  'highest_last_sale',
  'price_low_to_high',
  'price_high_to_low',
]

export const OFFERS_STATUS_FILTER_LABELS = ['Listed', 'Has Offers'] as const

export const YOUR_DOMAINS_FILTER_LABELS = ['Listed', 'Expiring Soon'] as const

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

export const MY_DOMAINS_CATEGORIES = [
  'Dictionary',
  'Names',
  'Characters',
  'Crypto',
  'Creatures',
  'Animals',
  'Misc',
  'Web',
  'Places',
]
