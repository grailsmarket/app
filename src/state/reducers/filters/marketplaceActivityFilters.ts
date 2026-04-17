import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { ActivityFiltersOpenedState, ActivityFiltersState, ActivityTypeFilterType } from '@/types/filters/activity'
import {
  ACTIVITY_FILTERS_ACTIONS,
  DEFAULT_ACTIVITY_FILTERS_OPENED_STATE,
  DEFAULT_ACTIVITY_FILTERS_STATE,
} from '@/constants/filters/activity'

export const emptyFilterState: ActivityFiltersState = DEFAULT_ACTIVITY_FILTERS_STATE

// Initial State
export const initialState: ActivityFiltersOpenedState = DEFAULT_ACTIVITY_FILTERS_OPENED_STATE

// Slice
export const marketplaceActivityFiltersSlice = createSlice({
  name: 'marketplaceActivityFilters',
  initialState,
  reducers: {
    ...ACTIVITY_FILTERS_ACTIONS,
  },
})

// Actions
export const marketplaceActivityFiltersActions = marketplaceActivityFiltersSlice.actions

export const { toggleFiltersType, setFiltersType, setFiltersOpen, setFiltersScrollTop, clearFilters } =
  marketplaceActivityFiltersActions

// Selectors
export const selectMarketplaceActivityFilters = (state: RootState) => state.filters.marketplaceActivityFilters

// Reducer
export default marketplaceActivityFiltersSlice.reducer
