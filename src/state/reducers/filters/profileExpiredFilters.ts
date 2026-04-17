import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { NameFilters, NamefiltersOpened } from '@/types/filters/name'
import {
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'

// Status is always Premium and Available for expired domains
export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  status: ['Premium', 'Available'],
}

// Initial State - Status filter is not in openFilters since it's fixed
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Premium', 'Available'],
  sort: 'expiry_date_desc',
}

// Slice
export const profileExpiredFiltersSlice = createSlice({
  name: 'profileExpiredFilters',
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
export const ProfileExpiredFilterActions = profileExpiredFiltersSlice.actions

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
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setScrollTop,
  clearFilters,
  setWatchersCount,
  setViewCount,
  setClubsCount,
  setCreationDate,
} = ProfileExpiredFilterActions

// Selectors
export const selectProfileExpiredFilters = (state: RootState) => state.filters.profileExpiredFilters

// Reducer
export default profileExpiredFiltersSlice.reducer
