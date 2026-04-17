import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ACTIVITY_FILTERS_ACTIONS,
  DEFAULT_ACTIVITY_FILTERS_OPENED_STATE,
  DEFAULT_ACTIVITY_FILTERS_STATE,
} from '@/constants/filters/activity'
import { ActivityFiltersOpenedState, ActivityFiltersState } from '@/types/filters/activity'

export const emptyFilterState: ActivityFiltersState = DEFAULT_ACTIVITY_FILTERS_STATE

// Initial State
export const initialState: ActivityFiltersOpenedState = DEFAULT_ACTIVITY_FILTERS_OPENED_STATE

// Slice
export const categoriesActivityFiltersSlice = createSlice({
  name: 'categoriesActivityFilters',
  initialState,
  reducers: ACTIVITY_FILTERS_ACTIONS,
})

// Actions
export const categoriesActivityFiltersActions = categoriesActivityFiltersSlice.actions

export const { toggleFiltersType, setFiltersType, clearFilters, setFiltersOpen, setFiltersScrollTop } =
  categoriesActivityFiltersActions

// Selectors
export const selectCategoriesActivityFilters = (state: RootState) => state.filters.categoriesActivityFilters

// Reducer
export default categoriesActivityFiltersSlice.reducer
