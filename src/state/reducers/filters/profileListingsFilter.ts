import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MarketFiltersState, NameFilters, NamefiltersOpened } from '@/types/filters/name'
import {
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'

const LISTINGS_MARKET_FILTERS_STATE: MarketFiltersState = {
  ...DEFAULT_MARKET_FILTERS_STATE,
  Listed: 'yes',
}

export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  market: LISTINGS_MARKET_FILTERS_STATE,
}

// Initial State
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Registered'],
  market: LISTINGS_MARKET_FILTERS_STATE,
  sort: 'price_asc',
}

// Slice
export const profileListingsFiltersSlice = createSlice({
  name: 'profileListingsFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
    clearFilters(state) {
      state = {
        ...emptyFilterState,
        open: state.open,
        scrollTop: state.scrollTop,
      }
    },
  },
})

// Actions
export const ProfileListingsFilterActions = profileListingsFiltersSlice.actions

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
} = ProfileListingsFilterActions

// Selectors
export const selectProfileListingsFilters = (state: RootState) => state.filters.profileListingsFilters

// Reducer
export default profileListingsFiltersSlice.reducer
