import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ACTIVITY_FILTERS_ACTIONS,
  DEFAULT_ACTIVITY_FILTERS_OPENED_STATE,
  DEFAULT_ACTIVITY_FILTERS_STATE,
} from '@/constants/filters/activity'
import { ActivityFiltersOpenedState, ActivityFiltersState } from '@/types/filters/activity'

// Types

export const emptyFilterState: ActivityFiltersState = DEFAULT_ACTIVITY_FILTERS_STATE

// Initial State
export const initialState: ActivityFiltersOpenedState = DEFAULT_ACTIVITY_FILTERS_OPENED_STATE

// Slice
export const profileActivityFiltersSlice = createSlice({
  name: 'profileActivityFilters',
  initialState,
  reducers: {
    ...ACTIVITY_FILTERS_ACTIONS,
  },
})

// Actions
export const profileActivityFiltersActions = profileActivityFiltersSlice.actions

export const { toggleFiltersType, setFiltersType, clearFilters, setFiltersOpen, setFiltersScrollTop } =
  profileActivityFiltersActions

// Selectors
export const selectProfileActivityFilters = (state: RootState) => state.filters.profileActivityFilters

// Reducer
export default profileActivityFiltersSlice.reducer
