import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { NameFilters, NamefiltersOpened } from '@/types/filters/name'
import {
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'

export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
}

// Initial State ------------------------------------
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
}

// Slice -------------------------------------------
export const bulkSearchFiltersSlice = createSlice({
  name: 'bulkSearchFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions --------------------------------------------
export const BulkSearchFilterActions = bulkSearchFiltersSlice.actions

export const {
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
  setClubsCount,
  setCreationDate,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setSearch,
  clearFilters,
} = BulkSearchFilterActions

// Selectors ------------------------------------------
export const selectBulkSearchFilters = (state: RootState) => state.filters.bulkSearchFilters

// Reducer --------------------------------------------
export default bulkSearchFiltersSlice.reducer
