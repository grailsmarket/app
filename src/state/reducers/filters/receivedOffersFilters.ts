import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../index'
import { selectActiveProfileFilters } from './selectActiveProfileFilters'
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
}

// Slice -------------------------------------------
export const receivedOffersFiltersSlice = createSlice({
  name: 'receivedOffersFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions --------------------------------------------
export const receivedOffersFiltersActions = receivedOffersFiltersSlice.actions

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
  setClubsCount,
  setCreationDate,
  toggleCategory,
  setFiltersCategory,
  addCategories,
  removeCategories,
  setSort,
  setScrollTop,
  clearFilters,
} = receivedOffersFiltersActions

// Selectors ------------------------------------------
export const selectReceivedOffersFilters = (state: RootState) =>
  selectActiveProfileFilters(state)?.received_offers ?? initialState

// Reducer --------------------------------------------
export default receivedOffersFiltersSlice.reducer
