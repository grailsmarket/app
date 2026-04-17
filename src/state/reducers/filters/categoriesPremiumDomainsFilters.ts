import { createSlice } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  DEFAULT_NAME_FILTERS_OPENED_STATE,
  DEFAULT_NAME_FILTERS_STATE,
  NAME_FILTERS_ACTIONS,
} from '@/constants/filters/name'
import { NameFilters, NamefiltersOpened } from '@/types/filters/name'

// Status is always 'Premium' for this tab
export const emptyFilterState: NameFilters = {
  ...DEFAULT_NAME_FILTERS_STATE,
  status: ['Premium'],
}

// Initial State - Status filter is not in openFilters since it's hidden
export const initialState: NamefiltersOpened = {
  ...DEFAULT_NAME_FILTERS_OPENED_STATE,
  status: ['Premium'],
  sort: 'expiry_date_asc',
}

// Slice
export const categoriesPremiumDomainsFiltersSlice = createSlice({
  name: 'categoriesPremiumDomainsFilters',
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
export const CategoriesPremiumDomainsFilterActions = categoriesPremiumDomainsFiltersSlice.actions

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
} = CategoriesPremiumDomainsFilterActions

// Selectors
export const selectCategoriesPremiumDomainsFilters = (state: RootState) => state.filters.categoriesPremiumDomainsFilters

// Reducer
export default categoriesPremiumDomainsFiltersSlice.reducer
