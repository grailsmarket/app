import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
  DEFAULT_NAME_FILTERS_OPENED_STATE,
} from '@/constants/filters/name'
import { MarketFiltersState, NameFilters, NamefiltersOpened } from '@/types/filters/name'

// Default market filters state with Listed: 'yes'
const LISTINGS_MARKET_FILTERS_STATE: MarketFiltersState = {
  ...DEFAULT_MARKET_FILTERS_STATE,
  Listed: 'yes',
}

export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  market: { ...LISTINGS_MARKET_FILTERS_STATE },
}

// Initial State
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Registered'],
  market: LISTINGS_MARKET_FILTERS_STATE,
  sort: 'price_asc',
}

// Slice
export const categoriesListingsFiltersSlice = createSlice({
  name: 'categoriesListingsFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
    clearFilters(state) {
      return {
        ...emptyFilterState,
        open: state.open,
        scrollTop: state.scrollTop,
      }
    },
  },
})

// Actions
export const CategoriesListingsFilterActions = categoriesListingsFiltersSlice.actions

export const {
  setFiltersOpen,
  setSearch,
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
  setClubsCount,
  setCreationDate,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setScrollTop,
  clearFilters,
} = CategoriesListingsFilterActions

// Selectors
export const selectCategoriesListingsFilters = (state: RootState) => state.filters.categoriesListingsFilters

// Reducer
export default categoriesListingsFiltersSlice.reducer
