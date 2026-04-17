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
  status: ['Premium'],
}

// Initial State
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Premium'],
  sort: 'expiry_date_asc',
}

// Slice
export const categoryPremiumFiltersSlice = createSlice({
  name: 'categoryPremiumFilters',
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
export const CategoryPremiumFilterActions = categoryPremiumFiltersSlice.actions

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
  setCreationDate,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setScrollTop,
  clearFilters,
} = CategoryPremiumFilterActions

// Selectors
export const selectCategoryPremiumFilters = (state: RootState) => state.filters.categoryPremiumFilters

// Reducer
export default categoryPremiumFiltersSlice.reducer
