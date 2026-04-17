import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'
import { NameFilters, NamefiltersOpened, MarketFiltersState } from '@/types/filters/name'

// Default market filters state with Listed: 'yes'
const LISTINGS_MARKET_FILTERS_STATE: MarketFiltersState = {
  ...DEFAULT_MARKET_FILTERS_STATE,
  Listed: 'yes',
}

export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  market: LISTINGS_MARKET_FILTERS_STATE,
}

// Initial State
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Registered'],
  market: LISTINGS_MARKET_FILTERS_STATE,
  sort: 'price_asc',
}

// Slice
export const categoryListingsFiltersSlice = createSlice({
  name: 'categoryListingsFilters',
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
export const CategoryListingsFilterActions = categoryListingsFiltersSlice.actions

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
} = CategoryListingsFilterActions

// Selectors
export const selectCategoryListingsFilters = (state: RootState) => state.filters.categoryListingsFilters

// Reducer
export default categoryListingsFiltersSlice.reducer
