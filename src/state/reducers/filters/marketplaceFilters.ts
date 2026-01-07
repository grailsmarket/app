import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ALL_SORT_FILTERS,
  YOUR_DOMAINS_FILTER_LABELS,
  OFFERS_STATUS_FILTER_LABELS,
  MARKETPLACE_OPENABLE_FILTERS,
  MARKETPLACE_TYPE_FILTER_LABELS,
  MARKETPLACE_STATUS_FILTER_LABELS,
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
  TypeFiltersState,
  TypeFilterOption,
  MarketplaceTypeFilterLabel,
  MarketFiltersState,
  TextMatchFiltersState,
} from '@/constants/filters/marketplaceFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'

// Types --------------------------------------------
export type MarketplaceStatusFilterType =
  | (typeof MARKETPLACE_STATUS_FILTER_LABELS)[number]
  | (typeof OFFERS_STATUS_FILTER_LABELS)[number]
  | (typeof YOUR_DOMAINS_FILTER_LABELS)[number]

export type ProfileOffersStatusFilterType = (typeof OFFERS_STATUS_FILTER_LABELS)[number]

export type ProfileDomainsStatusFilterType = (typeof YOUR_DOMAINS_FILTER_LABELS)[number]

export type MarketplaceTypeFilterType = (typeof MARKETPLACE_TYPE_FILTER_LABELS)[number]

export type MarketplaceLengthType = {
  min: number | null
  max: number | null
}

export type MarketplacePriceType = {
  min: number | null
  max: number | null
}

export type PriceDenominationType = (typeof PRICE_DENOMINATIONS)[number]

export type MarketplaceCategoryType = string

export type MarketplaceOpenableFilterType = (typeof MARKETPLACE_OPENABLE_FILTERS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]

export type MarketplaceFiltersState = {
  search: string
  status: MarketplaceStatusFilterType[]
  market: MarketFiltersState
  type: TypeFiltersState
  textMatch: TextMatchFiltersState
  length: MarketplaceLengthType
  denomination: PriceDenominationType
  priceRange: MarketplacePriceType
  categories: string[]
  sort: SortFilterType | null
}

export type MarketplaceFiltersOpenedState = MarketplaceFiltersState & {
  openFilters: MarketplaceOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export const emptyFilterState: MarketplaceFiltersState = {
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
}

// Initial State ------------------------------------
export const initialState: MarketplaceFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
  open: false,
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categories: [],
  openFilters: ['Sort', 'Status', 'Market', 'Type', 'Text Match', 'Length', 'Price Range'],
  sort: null,
  scrollTop: 0,
}

export type MarketplaceFiltersType = MarketplaceFiltersState & {
  name: string
}

// Slice -------------------------------------------
export const marketplaceFiltersSlice = createSlice({
  name: 'marketplaceFilters',
  initialState,
  reducers: {
    setMarketplaceFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleMarketplaceFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      if (state.status.includes(payload)) {
        state.status = state.status.filter((status) => status !== payload)
      } else {
        state.status.push(payload)
      }
    },
    setMarketplaceFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      state.status = [payload]
    },
    setMarketplaceTypeFilter(
      state,
      { payload }: PayloadAction<{ label: MarketplaceTypeFilterLabel; option: TypeFilterOption }>
    ) {
      const { label, option } = payload
      // If selecting 'only', set all others to 'none'
      if (option === 'only') {
        state.type = { ...DEFAULT_TYPE_FILTERS_STATE, [label]: 'only' }
      } else {
        state.type[label] = option
      }
    },
    // Keep for backwards compatibility but update to new structure
    toggleMarketplaceFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterLabel>) {
      // Toggle between 'none' and 'include'
      state.type[payload] = state.type[payload] === 'none' ? 'include' : 'none'
    },
    setMarketplaceFiltersType(state, { payload }: PayloadAction<TypeFiltersState>) {
      state.type = payload
    },
    setMarketplaceMarketFilters(state, { payload }: PayloadAction<MarketFiltersState>) {
      state.market = payload
    },
    setMarketplaceTextMatchFilters(state, { payload }: PayloadAction<TextMatchFiltersState>) {
      state.textMatch = payload
    },
    setMarketplaceFiltersLength(state, { payload }: PayloadAction<MarketplaceLengthType>) {
      state.length = payload
    },
    setMarketplacePriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setMarketplacePriceRange(state, { payload }: PayloadAction<MarketplacePriceType>) {
      state.priceRange = payload
    },
    toggleMarketplaceCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setMarketplaceFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setMarketplaceSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setMarketplaceSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setMarketplaceScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleMarketplaceFilterOpen(state, { payload }: PayloadAction<MarketplaceOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearMarketplaceFilters(state) {
      state.search = ''
      state.status = []
      state.market = { ...DEFAULT_MARKET_FILTERS_STATE }
      state.type = { ...DEFAULT_TYPE_FILTERS_STATE }
      state.textMatch = { ...DEFAULT_TEXT_MATCH_FILTERS_STATE }
      state.length = {
        min: null,
        max: null,
      }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = {
        min: null,
        max: null,
      }
      state.categories = []
      state.openFilters = ['Sort', 'Status', 'Market', 'Type', 'Text Match', 'Length', 'Price Range']
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setMarketplaceFiltersOpen,
  toggleMarketplaceFiltersStatus,
  setMarketplaceFiltersStatus,
  setMarketplaceTypeFilter,
  toggleMarketplaceFiltersType,
  setMarketplaceFiltersType,
  setMarketplaceMarketFilters,
  setMarketplaceTextMatchFilters,
  setMarketplaceFiltersLength,
  setMarketplacePriceDenomination,
  setMarketplacePriceRange,
  toggleMarketplaceCategory,
  setMarketplaceFiltersCategory,
  setMarketplaceSort,
  setMarketplaceSearch,
  setMarketplaceScrollTop,
  toggleMarketplaceFilterOpen,
  clearMarketplaceFilters,
} = marketplaceFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMarketplaceFilters = (state: RootState) => state.filters.marketplaceFilters

// Reducer --------------------------------------------
export default marketplaceFiltersSlice.reducer
