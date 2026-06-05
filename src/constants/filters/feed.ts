import type { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_MARKET_FILTERS_STATE } from './name'
import type { ActivityTypeFilterType } from '@/types/filters/activity'
import type { FeedFiltersOpenedState, FeedFiltersState, FeedTab } from '@/types/filters/feed'
import type { MarketFiltersState, PriceType } from '@/types/filters/name'
import { ACTIVITY_TYPE_FILTERS } from './activity'

export const FEED_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Trending', value: 'trending' },
  { label: 'Comments', value: 'comments' },
  { label: 'Activity', value: 'activity' },
  { label: 'Watchlist', value: 'watchlist' },
] as const

export const TRENDING_ACTIVITY_TYPES = ['mint', 'sold', 'offer_made'] as ActivityTypeFilterType[]
export const TRENDING_ACTIVITY_FILTERS = ACTIVITY_TYPE_FILTERS.filter((filter) =>
  TRENDING_ACTIVITY_TYPES.includes(filter.value)
)
export const TRENDING_MIN_WEI = '100000000000000000'

export const DEFAULT_FEED_FILTERS_STATE: FeedFiltersState = {
  selectedTab: FEED_TABS[0],
  categories: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: [],
  search: '',
  price: { min: null, max: null },
}

export const DEFAULT_FEED_FILTERS_OPENED_STATE: FeedFiltersOpenedState = {
  ...DEFAULT_FEED_FILTERS_STATE,
  open: false,
  scrollTop: 0,
}

export const setSelectedTab = (state: FeedFiltersOpenedState, { payload }: PayloadAction<FeedTab>) => {
  state.selectedTab = payload
}

export const setSearch = (state: FeedFiltersOpenedState, { payload }: PayloadAction<string>) => {
  state.search = payload
}

export const setMarketFilters = (state: FeedFiltersOpenedState, { payload }: PayloadAction<MarketFiltersState>) => {
  state.market = payload
}

export const toggleFiltersType = (
  state: FeedFiltersOpenedState,
  { payload }: PayloadAction<ActivityTypeFilterType>
) => {
  if (state.type.includes(payload)) {
    state.type = state.type.filter((type) => type !== payload)
  } else {
    state.type.push(payload)
  }
}

export const setFiltersType = (
  state: FeedFiltersOpenedState,
  { payload }: PayloadAction<ActivityTypeFilterType[] | ActivityTypeFilterType>
) => {
  state.type = Array.isArray(payload) ? payload : [payload]
}

export const setPriceRange = (state: FeedFiltersOpenedState, { payload }: PayloadAction<PriceType>) => {
  state.price = payload
}

export const toggleCategory = (state: FeedFiltersOpenedState, { payload }: PayloadAction<string>) => {
  if (state.categories.includes(payload)) {
    state.categories = state.categories.filter((category) => category !== payload)
  } else {
    state.categories.push(payload)
  }
}

export const setFiltersCategory = (state: FeedFiltersOpenedState, { payload }: PayloadAction<string>) => {
  state.categories = [payload]
}

export const addCategories = (state: FeedFiltersOpenedState, { payload }: PayloadAction<string[]>) => {
  payload.forEach((category) => {
    if (!state.categories.includes(category)) state.categories.push(category)
  })
}

export const removeCategories = (state: FeedFiltersOpenedState, { payload }: PayloadAction<string[]>) => {
  state.categories = state.categories.filter((category) => !payload.includes(category))
}

export const setFiltersOpen = (state: FeedFiltersOpenedState, { payload }: PayloadAction<boolean>) => {
  state.open = payload
}

export const setScrollTop = (state: FeedFiltersOpenedState, { payload }: PayloadAction<number>) => {
  state.scrollTop = payload
}

export const clearFilters = (state: FeedFiltersOpenedState) => ({
  ...DEFAULT_FEED_FILTERS_STATE,
  selectedTab: state.selectedTab,
  open: state.open,
  scrollTop: state.scrollTop,
})

export const FEED_FILTERS_ACTIONS = {
  setSelectedTab,
  setSearch,
  setMarketFilters,
  toggleFiltersType,
  setFiltersType,
  setPriceRange,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setFiltersOpen,
  setScrollTop,
  clearFilters,
} as const
