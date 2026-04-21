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

export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
}

// Slice -------------------------------------------
export const watchlistFiltersSlice = createSlice({
  name: 'watchlistFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions --------------------------------------------
export const WatchlistFilterActions = watchlistFiltersSlice.actions

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
} = WatchlistFilterActions

// Selectors ------------------------------------------
export const selectWatchlistFilters = (state: RootState) => state.filters.watchlistFilters

// Reducer --------------------------------------------
export default watchlistFiltersSlice.reducer
