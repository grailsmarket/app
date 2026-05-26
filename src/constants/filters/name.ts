import {
  ClubsCountType,
  LengthType,
  MarketFilterLabel,
  MarketFilterOption,
  MarketFiltersState,
  MarketplaceOption,
  NameFilters,
  NamefiltersOpened,
  OfferType,
  PriceDenominationType,
  PriceType,
  SortFilterType,
  SortType,
  StatusType,
  TextMatchFilterLabel,
  TextMatchFiltersState,
  TextNonMatchFilterLabel,
  TextNonMatchFiltersState,
  TypeFilterLabel,
  TypeFilterOption,
  TypeFiltersState,
  ViewCountType,
  WatchersCountType,
} from '@/types/filters/name'
import { PRICE_DENOMINATIONS } from '.'
import { PayloadAction } from '@reduxjs/toolkit'

export const MARKETPLACE_TYPE_FILTER_LABELS = ['Letters', 'Digits', 'Emojis', 'Repeating'] as const

export const MY_NAMES_FILTER_LABELS = ['Grace', 'Registered'] as const

export const TYPE_FILTER_OPTIONS = ['none', 'include', 'exclude', 'only'] as const

export const TYPE_FILTER_OPTION_LABELS: Record<TypeFilterOption, string> = {
  none: '---',
  include: 'Include',
  exclude: 'Exclude',
  only: 'Only',
}

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

export const MARKET_FILTER_OPTIONS = ['none', 'yes', 'no'] as const

export const MARKET_FILTER_OPTION_LABELS: Record<MarketFilterOption, string> = {
  none: '---',
  yes: 'Yes',
  no: 'No',
}

// Marketplace (platform) filter constants
export const MARKETPLACE_OPTIONS = ['none', 'grails', 'opensea'] as const

export const MARKETPLACE_OPTION_LABELS: Record<MarketplaceOption, string> = {
  none: '---',
  grails: 'Grails',
  opensea: 'Opensea',
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

export const NAME_STATUS_FILTER_LABELS = ['Registered', 'Grace', 'Premium', 'Available'] as const

export const NAME_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const NAME_STATUS_PARAM_OPTIONS: Record<string, string> = {
  Registered: 'registered',
  Listed: 'listed',
  Unlisted: 'unlisted',
  Grace: 'grace',
  Premium: 'premium',
  Available: 'available',
  'Has Last Sale': 'has_last_sale',
  'Has Offers': 'has_offers',
}

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
  'offer_asc',
  'offer_desc',
  'watchers_count_asc',
  'watchers_count_desc',
  'view_count_asc',
  'view_count_desc',
  'clubs_count_asc',
  'clubs_count_desc',
  'creation_date_asc',
  'creation_date_desc',
  'ranking_asc',
  'ranking_desc',
  'listing_date_asc',
  'listing_date_desc',
  'listing_expiry_asc',
  'listing_expiry_desc',
] as const

// Sort types for the dropdown (without direction)
export const SORT_TYPES = [
  'expiry_date',
  'price',
  'last_sale_price',
  'last_sale_date',
  'watchers_count',
  'offer',
  'view_count',
  'clubs_count',
  'creation_date',
  'alphabetical',
  'ranking',
] as const

export const SORT_LISTING_FILTERS = ['listing_date', 'listing_expiry'] as const

export const SORT_TYPE_LABELS: Record<SortType, string> = {
  expiry_date: 'Expiration',
  price: 'Price',
  last_sale_price: 'Last Sale Price',
  last_sale_date: 'Last Sale Date',
  offer: 'Offer',
  watchers_count: 'Watchlist Count',
  view_count: 'View Count',
  alphabetical: 'Alphabetical',
  clubs_count: 'Categories Count',
  creation_date: 'Creation Date',
  ranking: 'Categories Ranking',
}

export const SORT_LISTING_FILTER_LABELS = {
  listing_date: 'Listing Date',
  listing_expiry: 'Listing Expiry',
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
  watchers_count_asc: 'Watchlist Count (Low to High)',
  watchers_count_desc: 'Watchlist Count (High to Low)',
  view_count_asc: 'View Count (Low to High)',
  view_count_desc: 'View Count (High to Low)',
  alphabetical_asc: 'Alphabetical (A-Z)',
  alphabetical_desc: 'Alphabetical (Z-A)',
  clubs_count_asc: 'Clubs Count (Low to High)',
  clubs_count_desc: 'Categories Count (High to Low)',
  creation_date_asc: 'Creation Date (Old to New)',
  creation_date_desc: 'Creation Date (New to Old)',
  listing_date_asc: 'Listing Date (Old to New)',
  listing_date_desc: 'Listing Date (New to Old)',
  listing_expiry_asc: 'Listing Expiry (Soonest First)',
  listing_expiry_desc: 'Listing Expiry (Latest First)',
}

export const DEFAULT_NAME_FILTERS_STATE: NameFilters = {
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  textNonMatch: { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  offerRange: {
    min: null,
    max: null,
  },
  watchersCount: {
    min: null,
    max: null,
  },
  viewCount: {
    min: null,
    max: null,
  },
  clubsCount: {
    min: null,
    max: null,
  },
  creationDate: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
  aiSearch: false,
}

// Slice States
export const DEFAULT_NAME_FILTERS_OPENED_STATE: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_STATE,
  open: false,
  scrollTop: 0,
}

// Reducer Actions
export const setFilters = (state: NamefiltersOpened, { payload }: PayloadAction<Partial<NameFilters>>) => {
  return {
    ...state,
    ...payload,
  }
}

export const setFiltersOpen = (state: NamefiltersOpened, { payload }: PayloadAction<boolean>) => {
  state.open = payload
}

export const toggleFiltersStatus = (state: NamefiltersOpened, { payload }: PayloadAction<StatusType>) => {
  if (state.status.includes(payload)) {
    state.status = state.status.filter((status) => status !== payload)
  } else {
    if (payload === null) {
      state.status = []
    } else {
      state.status.push(payload)
    }
  }
}

export const setFiltersStatus = (state: NamefiltersOpened, { payload }: PayloadAction<StatusType>) => {
  if (payload === null) {
    state.status = []
  } else {
    state.status = [payload]
  }
}

export const setTypeFilter = (
  state: NamefiltersOpened,
  { payload }: PayloadAction<{ label: TypeFilterLabel; option: TypeFilterOption }>
) => {
  const { label, option } = payload
  // If selecting 'only', set all others to 'none'
  if (option === 'only') {
    state.type = { ...DEFAULT_TYPE_FILTERS_STATE, [label]: 'only' }
  } else {
    state.type[label] = option
  }
}

// Keep for backwards compatibility but update to new structure
export const toggleFiltersType = (state: NamefiltersOpened, { payload }: PayloadAction<TypeFilterLabel>) => {
  // Toggle between 'include' and 'exclude'
  state.type[payload] = state.type[payload] === 'include' ? 'exclude' : 'include'
}

export const setFiltersType = (state: NamefiltersOpened, { payload }: PayloadAction<TypeFiltersState>) => {
  state.type = payload
}

export const setMarketFilters = (state: NamefiltersOpened, { payload }: PayloadAction<MarketFiltersState>) => {
  state.market = payload
}

export const setTextMatchFilters = (state: NamefiltersOpened, { payload }: PayloadAction<TextMatchFiltersState>) => {
  state.textMatch = payload
}

export const setTextNonMatchFilters = (
  state: NamefiltersOpened,
  { payload }: PayloadAction<TextNonMatchFiltersState>
) => {
  state.textNonMatch = payload
}

export const setFiltersLength = (state: NamefiltersOpened, { payload }: PayloadAction<LengthType>) => {
  state.length = payload
}

export const setPriceDenomination = (state: NamefiltersOpened, { payload }: PayloadAction<PriceDenominationType>) => {
  state.priceRange = { min: null, max: null }
  state.denomination = payload
}

export const setPriceRange = (state: NamefiltersOpened, { payload }: PayloadAction<PriceType>) => {
  state.priceRange = payload
}

export const setOfferRange = (state: NamefiltersOpened, { payload }: PayloadAction<OfferType>) => {
  state.offerRange = payload
}

export const setWatchersCount = (state: NamefiltersOpened, { payload }: PayloadAction<WatchersCountType>) => {
  state.watchersCount = payload
}

export const setViewCount = (state: NamefiltersOpened, { payload }: PayloadAction<ViewCountType>) => {
  state.clubsCount = payload
}

export const setCreationDate = (
  state: NamefiltersOpened,
  { payload }: PayloadAction<{ min: string | null; max: string | null }>
) => {
  state.creationDate = payload
}

export const toggleCategory = (state: NamefiltersOpened, { payload }: PayloadAction<string>) => {
  const isFilterIncludesPayload = state.categories.includes(payload)

  if (isFilterIncludesPayload) {
    state.categories = state.categories.filter((category) => category !== payload)
  } else {
    state.categories.push(payload)
  }
}

export const setFiltersCategory = (state: NamefiltersOpened, { payload }: PayloadAction<string>) => {
  state.categories = [payload]
}

export const addCategories = (state: NamefiltersOpened, { payload }: PayloadAction<string[]>) => {
  payload.forEach((category) => {
    if (!state.categories.includes(category)) {
      state.categories.push(category)
    }
  })
}

export const removeCategories = (state: NamefiltersOpened, { payload }: PayloadAction<string[]>) => {
  state.categories = state.categories.filter((category) => !payload.includes(category))
}

export const setClubsCount = (state: NamefiltersOpened, { payload }: PayloadAction<ClubsCountType>) => {
  state.clubsCount = payload
}

export const setSort = (state: NamefiltersOpened, { payload }: PayloadAction<SortFilterType | null>) => {
  state.sort = payload
}

export const setSearch = (state: NamefiltersOpened, { payload }: PayloadAction<string>) => {
  state.search = payload
}

export const setAiSearch = (state: NamefiltersOpened, { payload }: PayloadAction<boolean>) => {
  state.aiSearch = payload
}

export const setScrollTop = (state: NamefiltersOpened, { payload }: PayloadAction<number>) => {
  state.scrollTop = payload
}

export const clearFilters = (state: NamefiltersOpened) => {
  return {
    ...DEFAULT_NAME_FILTERS_STATE,
    open: state.open,
    scrollTop: state.scrollTop,
  }
}

export const NAME_FILTERS_ACTIONS = {
  setFilters,
  setFiltersOpen,
  toggleFiltersStatus,
  setFiltersStatus,
  setTypeFilter,
  toggleFiltersType,
  setFiltersType,
  setMarketFilters,
  setTextMatchFilters,
  setTextNonMatchFilters,
  setFiltersLength,
  setPriceDenomination,
  setPriceRange,
  setOfferRange,
  setWatchersCount,
  setViewCount,
  setCreationDate,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setClubsCount,
  setSort,
  setSearch,
  setAiSearch,
  setScrollTop,
  clearFilters,
} as const
