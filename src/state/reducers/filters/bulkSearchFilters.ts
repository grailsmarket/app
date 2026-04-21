import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  DEFAULT_TEXT_MATCH_FILTERS_STATE,
  DEFAULT_TEXT_NON_MATCH_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import { NameFilters, NamefiltersOpened } from '@/types/filters/name'

export const emptyFilterState: NameFilters = {
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  textNonMatch: { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  offerRange: {
    min: null,
    max: null,
  },
  watchersCount: {
    min: null,
    max: null,
  },
  viewCount: {
    min: null,
    max: null,
  },
  clubsCount: {
    min: null,
    max: null,
  },
  creationDate: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
}

// Initial State ------------------------------------
export const initialState: NamefiltersOpened = {
  open: false,
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
  textMatch: { ...DEFAULT_TEXT_MATCH_FILTERS_STATE },
  textNonMatch: { ...DEFAULT_TEXT_NON_MATCH_FILTERS_STATE },
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  offerRange: {
    min: null,
    max: null,
  },
  watchersCount: {
    min: null,
    max: null,
  },
  viewCount: {
    min: null,
    max: null,
  },
  clubsCount: {
    min: null,
    max: null,
  },
  creationDate: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
  scrollTop: 0,
}

// Slice -------------------------------------------
export const bulkSearchFiltersSlice = createSlice({
  name: 'bulkSearchFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
  },
})

// Actions --------------------------------------------
export const bulkSearchFiltersActions = bulkSearchFiltersSlice.actions

export const {
  setFiltersOpen: setBulkSearchFiltersOpen,
  toggleFiltersStatus: toggleBulkSearchFiltersStatus,
  setFiltersStatus: setBulkSearchFiltersStatus,
  setTypeFilter: setBulkSearchTypeFilter,
  toggleFiltersType: toggleBulkSearchFiltersType,
  setFiltersType: setBulkSearchFiltersType,
  setMarketFilters: setBulkSearchMarketFilters,
  setTextMatchFilters: setBulkSearchTextMatchFilters,
  setTextNonMatchFilters: setBulkSearchTextNonMatchFilters,
  setFiltersLength: setBulkSearchFiltersLength,
  setPriceDenomination: setBulkSearchPriceDenomination,
  setPriceRange: setBulkSearchPriceRange,
  setOfferRange: setBulkSearchOfferRange,
  setWatchersCount: setBulkSearchWatchersCount,
  setViewCount: setBulkSearchViewCount,
  setClubsCount: setBulkSearchClubsCount,
  setCreationDate: setBulkSearchCreationDate,
  toggleCategory: toggleBulkSearchCategory,
  setFiltersCategory: setBulkSearchFiltersCategory,
  addCategories: addBulkSearchCategories,
  removeCategories: removeBulkSearchCategories,
  setSort: setBulkSearchSort,
  setSearch: setBulkSearchSearch,
  setScrollTop: setBulkSearchScrollTop,
  clearFilters: clearBulkSearchFilters,
} = bulkSearchFiltersActions

// Selectors ------------------------------------------
export const selectBulkSearchFilters = (state: RootState) => state.filters.bulkSearchFilters

// Reducer --------------------------------------------
export default bulkSearchFiltersSlice.reducer
