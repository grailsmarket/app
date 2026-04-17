import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'
import { MarketFiltersState, NameFilters, NamefiltersOpened } from '@/types/filters/name'

const LISTINGS_MARKET_FILTERS_STATE: MarketFiltersState = {
  ...DEFAULT_NAME_FILTERS_STATE.market,
  Listed: 'yes',
}

export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  market: LISTINGS_MARKET_FILTERS_STATE,
}

// Initial State ------------------------------------
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Registered'],
  market: LISTINGS_MARKET_FILTERS_STATE,
}

// Slice -------------------------------------------
export const marketplaceListingsFiltersSlice = createSlice({
  name: 'marketplaceListingsFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
    resetFilters(state) {
      state = {
        ...emptyFilterState,
        open: state.open,
        scrollTop: state.scrollTop,
      }
    },
  },
})

// Actions --------------------------------------------
export const MarketplaceListingsFilterActions = marketplaceListingsFiltersSlice.actions

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
  setSearch,
  setScrollTop,
  clearFilters,
} = MarketplaceListingsFilterActions

// Selectors ------------------------------------------
export const selectMarketplaceListingsFilters = (state: RootState) => state.filters.marketplaceListingsFilters

// Reducer --------------------------------------------
export default marketplaceListingsFiltersSlice.reducer
