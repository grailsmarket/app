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

// Initial State
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
}

// Slice
export const categoriesNamesFiltersSlice = createSlice({
  name: 'categoriesNamesFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions
export const CategoriesNamesFilterActions = categoriesNamesFiltersSlice.actions

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
} = CategoriesNamesFilterActions

// Selectors
export const selectCategoriesNamesFilters = (state: RootState) => state.filters.categoriesNamesFilters

// Reducer
export default categoriesNamesFiltersSlice.reducer
