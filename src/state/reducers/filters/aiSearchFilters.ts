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

// AI search is always on — bake it into both the empty and initial state so that
// isFiltersClear treats it as the default and the URL sync skips it.
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
  aiSearch: true,
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
  aiSearch: true,
}

// Slice -------------------------------------------
export const aiSearchFiltersSlice = createSlice({
  name: 'aiSearchFilters',
  initialState,
  reducers: {
    ...NAME_FILTERS_ACTIONS,
    // Override clearFilters so AI search stays on after a reset.
    clearFilters: (state) => ({
      ...emptyFilterState,
      open: state.open,
      scrollTop: state.scrollTop,
    }),
  },
})

// Actions --------------------------------------------
export const aiSearchFiltersActions = aiSearchFiltersSlice.actions

export const {
  setFiltersOpen: setAiSearchFiltersOpen,
  toggleFiltersStatus: toggleAiSearchFiltersStatus,
  setFiltersStatus: setAiSearchFiltersStatus,
  setTypeFilter: setAiSearchTypeFilter,
  toggleFiltersType: toggleAiSearchFiltersType,
  setFiltersType: setAiSearchFiltersType,
  setMarketFilters: setAiSearchMarketFilters,
  setTextMatchFilters: setAiSearchTextMatchFilters,
  setTextNonMatchFilters: setAiSearchTextNonMatchFilters,
  setFiltersLength: setAiSearchFiltersLength,
  setPriceDenomination: setAiSearchPriceDenomination,
  setPriceRange: setAiSearchPriceRange,
  setOfferRange: setAiSearchOfferRange,
  setWatchersCount: setAiSearchWatchersCount,
  setViewCount: setAiSearchViewCount,
  setClubsCount: setAiSearchClubsCount,
  setCreationDate: setAiSearchCreationDate,
  toggleCategory: toggleAiSearchCategory,
  setFiltersCategory: setAiSearchFiltersCategory,
  addCategories: addAiSearchCategories,
  removeCategories: removeAiSearchCategories,
  setSort: setAiSearchSort,
  setSearch: setAiSearchSearch,
  setScrollTop: setAiSearchScrollTop,
  clearFilters: clearAiSearchFilters,
} = aiSearchFiltersActions

// Selectors ------------------------------------------
export const selectAiSearchFilters = (state: RootState) => state.filters.aiSearchFilters

// Reducer --------------------------------------------
export default aiSearchFiltersSlice.reducer
