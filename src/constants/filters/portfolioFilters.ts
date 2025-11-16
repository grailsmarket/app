export const MY_DOMAINS_OPENABLE_FILTERS = ['Status', 'Type', 'Length', 'Price Range'] as const

export const MY_DOMAINS_TYPE_FILTER_LABELS = ['Letters', 'Numbers', 'Emojis'] as const

export const MY_DOMAINS_STATUS_FILTER_LABELS = ['Listed', 'Unlisted', 'Expiring Soon', 'Grace Period'] as const
export const RECEIVED_OFFERS_STATUS_FILTER_LABELS = ['Expiring Soon'] as const
export const MY_OFFERS_STATUS_FILTER_LABELS = ['Listed', 'Unlisted', 'Expiring Soon'] as const

export const MY_DOMAINS_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MY_DOMAINS_STATUS_PARAM_OPTIONS: Record<string, string> = {
  'Expiring Soon': 'expiring',
}

export const MY_DOMAINS_SORT_FILTERS = [
  'alphabetical_asc',
  'alphabetical_desc',
  'last_sale_price_asc',
  'last_sale_price_desc',
  'last_sale_date_asc',
  'last_sale_date_desc',
  'price_desc',
  'price_asc',
  'offer_asc',
  'offer_desc',
  'expiry_date_asc',
  'expiry_date_desc',
]

export const MY_DOMAINS_FILTER_LABELS = ['Listed', 'Unlisted', 'Expiring Soon', 'Grace Period'] as const

export const ALL_SORT_FILTERS = [
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

export const PROFILE_DOMAINS_FILTER_LABELS = ['Listed', 'Unlisted', 'Expiring Soon'] as const
export const PROFILE_ACTIVITY_FILTER_LABELS = [
  'Sale',
  'Transfer',
  'Offer',
  'Mint',
  'Listing',
  'Bought',
  'Sold',
  'Offer Accepted',
  'Offer Cancelled',
  'Listing Cancelled',
  'Minted',
  'Burned',
  'Sent',
  'Received',
  'Registration',
] as const

export const PROFILE_ACTIVITY_FILTERS = [
  { label: 'Listing', value: 'listed' },
  { label: 'Bought', value: 'bought' },
  { label: 'Sold', value: 'sold' },
  { label: 'Offer', value: 'offer_made' },
  { label: 'Offer Accepted', value: 'offer_accepted' },
  { label: 'Offer Cancelled', value: 'offer_cancelled' },
  { label: 'Listing Cancelled', value: 'listing_cancelled' },
  { label: 'Minted', value: 'mint' },
  { label: 'Sent', value: 'sent' },
  { label: 'Received', value: 'received' },
] as const
