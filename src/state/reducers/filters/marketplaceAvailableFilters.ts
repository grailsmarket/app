import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'
import { NameFilters, NamefiltersOpened } from '@/types/filters/name'

export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  status: ['Available'],
}

// Initial State
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Available'],
  sort: 'expiry_date_desc',
}

// Slice
export const marketplaceAvailableFiltersSlice = createSlice({
  name: 'marketplaceAvailableFilters',
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
export const MarketplaceAvailableFilterActions = marketplaceAvailableFiltersSlice.actions

export const {
  setFiltersOpen,
  setSearch,
  setTypeFilter,
  toggleFiltersType,
  setFiltersType,
  setMarketFilters,
  setTextMatchFilters,
  setTextNonMatchFilters,
  setFiltersLength,
  setPriceDenomination,
  setPriceRange,
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
} = MarketplaceAvailableFilterActions

// Selectors
export const selectMarketplaceAvailableFilters = (state: RootState) => state.filters.marketplaceAvailableFilters

// Reducer
export default marketplaceAvailableFiltersSlice.reducer
