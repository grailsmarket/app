export const MARKETPLACE_OPENABLE_FILTERS = [
  'Status',
  'Market',
  'Type',
  'Text Match',
  'Text Non-Match',
  'Length',
  'Price Range',
  'Activity',
  'Sort',
] as const

export const MARKETPLACE_TYPE_FILTER_LABELS = ['Letters', 'Digits', 'Emojis', 'Repeating'] as const

export type MarketplaceTypeFilterLabel = (typeof MARKETPLACE_TYPE_FILTER_LABELS)[number]

// Type filter options for each type category
export const TYPE_FILTER_OPTIONS = ['none', 'include', 'exclude', 'only'] as const

export type TypeFilterOption = (typeof TYPE_FILTER_OPTIONS)[number]

export const TYPE_FILTER_OPTION_LABELS: Record<TypeFilterOption, string> = {
  none: '---',
  include: 'Include',
  exclude: 'Exclude',
  only: 'Only',
}

// Type filter state structure
export type TypeFiltersState = Record<MarketplaceTypeFilterLabel, TypeFilterOption>

export const DEFAULT_TYPE_FILTERS_STATE: TypeFiltersState = {
  Letters: 'include',
  Digits: 'include',
  Emojis: 'include',
  Repeating: 'include',
}

export const EMPTY_TYPE_FILTERS_STATE: TypeFiltersState = {
  Letters: 'none',
  Digits: 'none',
  Emojis: 'none',
  Repeating: 'none',
}

export const MARKETPLACE_TYPE_FILTER_PARAM_OPTIONS: Record<string, string> = {
  Letters: 'letters',
  Digits: 'digits',
  Emojis: 'emojis',
  Repeating: 'repeatingChars',
}

// Market filter constants
export const MARKET_FILTER_LABELS = ['Listed', 'Has Offers', 'Has Last Sale'] as const
export const GRACE_FILTER_LABELS = ['Has Offers', 'Has Last Sale'] as const
export const LISTED_FILTER_LABELS = ['Has Offers', 'Has Last Sale'] as const
export const OFFERS_FILTER_LABELS = ['Listed', 'Has Last Sale'] as const

export type MarketFilterLabel = (typeof MARKET_FILTER_LABELS)[number]

export const MARKET_FILTER_OPTIONS = ['none', 'yes', 'no'] as const

export type MarketFilterOption = (typeof MARKET_FILTER_OPTIONS)[number]

export const MARKET_FILTER_OPTION_LABELS: Record<MarketFilterOption, string> = {
  none: '---',
  yes: 'Yes',
  no: 'No',
}

// Marketplace (platform) filter constants
export const MARKETPLACE_OPTIONS = ['none', 'grails', 'opensea'] as const

export type MarketplaceOption = (typeof MARKETPLACE_OPTIONS)[number]

export const MARKETPLACE_OPTION_LABELS: Record<MarketplaceOption, string> = {
  none: '---',
  grails: 'Grails',
  opensea: 'Opensea',
}

export type MarketFiltersState = Record<MarketFilterLabel, MarketFilterOption> & {
  marketplace: MarketplaceOption
}

export const DEFAULT_MARKET_FILTERS_STATE: MarketFiltersState = {
  Listed: 'none',
  'Has Offers': 'none',
  'Has Last Sale': 'none',
  marketplace: 'none',
}

// Map market filter labels to API query params
export const MARKET_FILTER_PARAM_OPTIONS: Record<MarketFilterLabel, string> = {
  Listed: 'listed',
  'Has Offers': 'hasOffer',
  'Has Last Sale': 'hasSales',
}

// Text Match filter constants
export const TEXT_MATCH_FILTER_LABELS = ['Contains', 'Starts with', 'Ends with'] as const

export type TextMatchFilterLabel = (typeof TEXT_MATCH_FILTER_LABELS)[number]

export type TextMatchFiltersState = Record<TextMatchFilterLabel, string>

export const DEFAULT_TEXT_MATCH_FILTERS_STATE: TextMatchFiltersState = {
  Contains: '',
  'Starts with': '',
  'Ends with': '',
}

// Map text match filter labels to API query params
export const TEXT_MATCH_FILTER_PARAM_OPTIONS: Record<TextMatchFilterLabel, string> = {
  Contains: 'contains',
  'Starts with': 'startsWith',
  'Ends with': 'endsWith',
}

// Text Non-Match filter constants
export const TEXT_NON_MATCH_FILTER_LABELS = ['Does not contain', 'Does not start with', 'Does not end with'] as const

export type TextNonMatchFilterLabel = (typeof TEXT_NON_MATCH_FILTER_LABELS)[number]

export type TextNonMatchFiltersState = Record<TextNonMatchFilterLabel, string>

export const DEFAULT_TEXT_NON_MATCH_FILTERS_STATE: TextNonMatchFiltersState = {
  'Does not contain': '',
  'Does not start with': '',
  'Does not end with': '',
}

// Map text non-match filter labels to API query params
export const TEXT_NON_MATCH_FILTER_PARAM_OPTIONS: Record<TextNonMatchFilterLabel, string> = {
  'Does not contain': 'doesNotContain',
  'Does not start with': 'doesNotStartWith',
  'Does not end with': 'doesNotEndWith',
}

export const MARKETPLACE_STATUS_FILTER_LABELS = ['Registered', 'Grace', 'Premium', 'Available'] as const

export const MARKETPLACE_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MARKETPLACE_STATUS_PARAM_OPTIONS: Record<string, string> = {
  Registered: 'registered',
  Listed: 'listed',
  Unlisted: 'unlisted',
  Grace: 'grace',
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

export const YOUR_DOMAINS_FILTER_LABELS = ['Listed', 'Unlisted', 'Grace'] as const

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
export const SORT_TYPES = ['expiry_date', 'price', 'last_sale_price', 'last_sale_date', 'alphabetical'] as const

export type SortType = (typeof SORT_TYPES)[number]

export const SORT_TYPE_LABELS: Record<SortType, string> = {
  expiry_date: 'Expiration',
  price: 'Price',
  last_sale_price: 'Last Sale Price',
  last_sale_date: 'Last Sale Date',
  alphabetical: 'Alphabetical',
}

export const SORT_FILTER_LABELS = {
  expiry_date_asc: 'Expiration Date (Soonest First)',
  expiry_date_desc: 'Expiration Date (Latest First)',
  last_sale_price_asc: 'Last Sale Price (Low to High)',
  last_sale_price_desc: 'Last Sale Price (High to Low)',
  last_sale_date_asc: 'Last Sale Date (Old to New)',
  last_sale_date_desc: 'Last Sale Date (New to Old)',
  price_desc: 'Price (High to Low)',
  price_asc: 'Price (Low to High)',
  offer_asc: 'Offer (Low to High)',
  offer_desc: 'Offer (High to Low)',
  alphabetical_asc: 'Alphabetical (A-Z)',
  alphabetical_desc: 'Alphabetical (Z-A)',
}
