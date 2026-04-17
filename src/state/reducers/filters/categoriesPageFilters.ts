import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  CATEGORIES_PAGE_FILTERS_ACTIONS,
  DEFAULT_CATEGORIES_PAGE_FILTERS_OPENED_STATE,
  DEFAULT_CATEGORIES_PAGE_FILTERS_STATE,
} from '@/constants/filters/categories'
import { CategoriesPageFiltersOpenedState, CategoriesPageFiltersState } from '@/types/filters/categories'

export const emptyFilterState: CategoriesPageFiltersState = {
  ...DEFAULT_CATEGORIES_PAGE_FILTERS_STATE,
}

// Initial State ------------------------------------
export const initialState: CategoriesPageFiltersOpenedState = {
  ...DEFAULT_CATEGORIES_PAGE_FILTERS_OPENED_STATE,
}

// Slice -------------------------------------------
export const categoriesPageFiltersSlice = createSlice({
  name: 'categoriesPageFilters',
  initialState,
  reducers: CATEGORIES_PAGE_FILTERS_ACTIONS,
})

// Actions --------------------------------------------
export const categoriesPageFiltersActions = categoriesPageFiltersSlice.actions

export const {
  setCategoriesPageFiltersOpen,
  setCategoriesPageSearch,
  toggleCategoriesPageType,
  setCategoriesPageType,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
  setCategoriesPageScrollTop,
  clearCategoriesPageFilters,
} = categoriesPageFiltersSlice.actions

// Selectors ------------------------------------------
export const selectCategoriesPageFilters = (state: RootState) => state.filters.categoriesPageFilters

// Reducer --------------------------------------------
export default categoriesPageFiltersSlice.reducer
