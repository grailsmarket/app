import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  MarketplaceCategoryType,
  MarketplaceFiltersOpenedState,
  MarketplaceFiltersState,
  MarketplaceLengthType,
  MarketplaceOpenableFilterType,
  MarketplacePriceType,
  MarketplaceOfferType,
  MarketplaceStatusFilterType,
  PriceDenominationType,
  SortFilterType,
} from './marketplaceFilters'
import {
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
  DEFAULT_TEXT_NON_MATCH_FILTERS_STATE,
  TypeFilterOption,
  MarketplaceTypeFilterLabel,
  TypeFiltersState,
  MarketFiltersState,
  TextMatchFiltersState,
  TextNonMatchFiltersState,
} from '@/constants/filters/marketplaceFilters'

export const emptyFilterState: MarketplaceFiltersState = {
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
  categories: [],
  openFilters: ['Sort', 'Status', 'Market', 'Type', 'Text Match', 'Text Non-Match', 'Length', 'Price Range', 'Offer'],
  sort: null,
  scrollTop: 0,
}

export type MarketplaceFiltersType = MarketplaceFiltersState & {
  name: string
}

// Slice -------------------------------------------
export const watchlistFiltersSlice = createSlice({
  name: 'watchlistFilters',
  initialState,
  reducers: {
    setWatchlistFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleWatchlistFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setWatchlistFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      state.status = [payload]
    },
    setWatchlistTypeFilter(
      state,
      { payload }: PayloadAction<{ label: MarketplaceTypeFilterLabel; option: TypeFilterOption }>
    ) {
      const { label, option } = payload
      if (option === 'only') {
        state.type = { ...DEFAULT_TYPE_FILTERS_STATE, [label]: 'only' }
      } else {
        state.type[label] = option
      }
    },
    toggleWatchlistFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterLabel>) {
      state.type[payload] = state.type[payload] === 'include' ? 'exclude' : 'include'
    },
    setWatchlistFiltersType(state, { payload }: PayloadAction<TypeFiltersState>) {
      state.type = payload
    },
    setWatchlistMarketFilters(state, { payload }: PayloadAction<MarketFiltersState>) {
      state.market = payload
    },
    setWatchlistTextMatchFilters(state, { payload }: PayloadAction<TextMatchFiltersState>) {
      state.textMatch = payload
    },
    setWatchlistTextNonMatchFilters(state, { payload }: PayloadAction<TextNonMatchFiltersState>) {
      state.textNonMatch = payload
    },
    setWatchlistFiltersLength(state, { payload }: PayloadAction<MarketplaceLengthType>) {
      state.length = payload
    },
    setWatchlistPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setWatchlistPriceRange(state, { payload }: PayloadAction<MarketplacePriceType>) {
      state.priceRange = payload
    },
    setWatchlistOfferRange(state, { payload }: PayloadAction<MarketplaceOfferType>) {
      state.offerRange = payload
    },
    toggleWatchlistCategory(state, { payload }: PayloadAction<MarketplaceCategoryType>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setWatchlistFiltersCategory(state, { payload }: PayloadAction<MarketplaceCategoryType>) {
      state.categories = [payload]
    },
    addWatchlistCategories(state, { payload }: PayloadAction<string[]>) {
      payload.forEach((category) => {
        if (!state.categories.includes(category)) {
          state.categories.push(category)
        }
      })
    },
    removeWatchlistCategories(state, { payload }: PayloadAction<string[]>) {
      state.categories = state.categories.filter((category) => !payload.includes(category))
    },
    setWatchlistFiltersSubcategory(state, { payload }: PayloadAction<string>) {
      state.categories = state.categories.filter((category) => category === payload)
    },
    toggleWatchlistSubcategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setWatchlistSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setWatchlistSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setWatchlistFiltersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleWatchlistFilterOpen(state, { payload }: PayloadAction<MarketplaceOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearWatchlistFilters(state) {
      state.search = ''
      state.status = []
      state.market = { ...DEFAULT_MARKET_FILTERS_STATE }
      state.type = { ...DEFAULT_TYPE_FILTERS_STATE }
      state.textMatch = { ...DEFAULT_TEXT_MATCH_FILTERS_STATE }
      state.textNonMatch = { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE }
      state.length = {
        min: null,
        max: null,
      }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = {
        min: null,
        max: null,
      }
      state.offerRange = {
        min: null,
        max: null,
      }
      state.categories = []
      state.openFilters = [
        'Sort',
        'Status',
        'Market',
        'Type',
        'Text Match',
        'Text Non-Match',
        'Length',
        'Price Range',
        'Offer',
      ]
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setWatchlistFiltersOpen,
  toggleWatchlistFiltersStatus,
  setWatchlistFiltersStatus,
  setWatchlistTypeFilter,
  toggleWatchlistFiltersType,
  setWatchlistFiltersType,
  setWatchlistMarketFilters,
  setWatchlistTextMatchFilters,
  setWatchlistTextNonMatchFilters,
  setWatchlistFiltersLength,
  setWatchlistPriceDenomination,
  setWatchlistPriceRange,
  setWatchlistOfferRange,
  toggleWatchlistCategory,
  toggleWatchlistSubcategory,
  setWatchlistFiltersCategory,
  addWatchlistCategories,
  removeWatchlistCategories,
  setWatchlistFiltersSubcategory,
  setWatchlistSort,
  setWatchlistSearch,
  setWatchlistFiltersScrollTop,
  toggleWatchlistFilterOpen,
  clearWatchlistFilters,
} = watchlistFiltersSlice.actions

// Selectors ------------------------------------------
export const selectWatchlistFilters = (state: RootState) => state.filters.watchlistFilters

// Reducer --------------------------------------------
export default watchlistFiltersSlice.reducer
