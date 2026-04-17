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
  sort: 'expiry_date_asc',
}
// Slice -------------------------------------------
export const myDomainsFiltersSlice = createSlice({
  name: 'myDomainsFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions --------------------------------------------
export const MyDomainsFilterActions = myDomainsFiltersSlice.actions

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
} = MyDomainsFilterActions

// Selectors ------------------------------------------
export const selectMyDomainsFilters = (state: RootState) => state.filters.myDomainsFilters

// Reducer --------------------------------------------
export default myDomainsFiltersSlice.reducer
