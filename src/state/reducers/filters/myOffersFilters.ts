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
}

// Initial State ------------------------------------
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
}

// Slice -------------------------------------------
export const myOffersFiltersSlice = createSlice({
  name: 'myOffersFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions --------------------------------------------
export const MyOffersFilterActions = myOffersFiltersSlice.actions

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
  setCreationDate,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setClubsCount,
  setSort,
  setSearch,
  setScrollTop,
  clearFilters,
} = MyOffersFilterActions

// Selectors ------------------------------------------
export const selectMyOffersFilters = (state: RootState) => state.filters.myOffersFilters

// Reducer --------------------------------------------
export default myOffersFiltersSlice.reducer
