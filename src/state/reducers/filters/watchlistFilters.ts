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
  MarketplaceStatusFilterType,
  MarketplaceTypeFilterType,
  PriceDenominationType,
  SortFilterType,
} from './marketplaceFilters'

export const emptyFilterState: MarketplaceFiltersState = {
  search: '',
  status: [],
  type: [],
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
  type: [],
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
  openFilters: ['Sort', 'Status', 'Type', 'Length', 'Price Range'],
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
    toggleWatchlistFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setWatchlistFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      state.type = [payload]
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
      state.type = []
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
      state.openFilters = ['Sort', 'Status', 'Type', 'Length', 'Price Range']
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setWatchlistFiltersOpen,
  toggleWatchlistFiltersStatus,
  setWatchlistFiltersStatus,
  toggleWatchlistFiltersType,
  setWatchlistFiltersType,
  setWatchlistFiltersLength,
  setWatchlistPriceDenomination,
  setWatchlistPriceRange,
  toggleWatchlistCategory,
  toggleWatchlistSubcategory,
  setWatchlistFiltersCategory,
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
