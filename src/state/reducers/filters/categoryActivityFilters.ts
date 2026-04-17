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
export const categoryActivityFiltersSlice = createSlice({
  name: 'categoryActivityFilters',
  initialState,
  reducers: {
    ...ACTIVITY_FILTERS_ACTIONS,
  },
})

// Actions
export const categoryActivityFiltersActions = categoryActivityFiltersSlice.actions

export const { toggleFiltersType, setFiltersType, setFiltersOpen, setFiltersScrollTop, clearFilters } =
  categoryActivityFiltersActions

// Selectors
export const selectCategoryActivityFilters = (state: RootState) => state.filters.categoryActivityFilters

// Reducer
export default categoryActivityFiltersSlice.reducer
