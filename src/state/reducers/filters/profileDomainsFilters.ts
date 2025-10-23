import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import { MY_DOMAINS_CATEGORIES, MY_DOMAINS_TYPE_FILTER_LABELS } from '@/constants/filters/portfolioFilters'
import {
  PortfolioFiltersOpenedState,
  PortfolioStatusFilterType,
  PortfolioTypeFilterType,
  PortfolioCategoryType,
  PortfolioOpenableFilterType,
  SortFilterType,
  PriceDenominationType,
  PriceType,
  LengthType,
} from '@/types/filters'

// Initial State
export const initialState: PortfolioFiltersOpenedState = {
  open: false,
  search: '',
  status: [],
  type: [...MY_DOMAINS_TYPE_FILTER_LABELS],
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categoryObjects: [],
  openFilters: ['Status'],
  sort: 'price_high_to_low',
}

// Slice
export const profileDomainsFiltersSlice = createSlice({
  name: 'profileDomainsFilters',
  initialState,
  reducers: {
    setFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    toggleFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      const index = state.status.findIndex((status) => status === payload)
      index > -1 ? state.status.splice(index, 1) : state.status.push(payload)
    },
    setFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      state.status = [payload]
    },
    toggleFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      index > -1 ? state.type.splice(index, 1) : state.type.push(payload)
    },
    setFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      state.type = [payload]
    },
    setFiltersLength(state, { payload }: PayloadAction<LengthType>) {
      state.length = payload
    },
    setPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.denomination = payload
      state.priceRange = { min: null, max: null }
    },
    setPriceRange(state, { payload }: PayloadAction<PriceType>) {
      state.priceRange = payload
    },
    toggleCategory(state, { payload }: PayloadAction<PortfolioCategoryType>) {
      const isFilterIncludesPayload = state.categoryObjects.includes(payload)
      
      if (isFilterIncludesPayload) {
        state.categoryObjects = state.categoryObjects.filter((cat) => cat !== payload)
      } else {
        state.categoryObjects = [...state.categoryObjects, ...MY_DOMAINS_CATEGORIES.filter((cat) => cat === payload)]
      }
    },
    setFiltersCategory(state, { payload }: PayloadAction<PortfolioCategoryType>) {
      state.categoryObjects = MY_DOMAINS_CATEGORIES.filter((cat) => cat === payload)
    },
    setSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    toggleFilterOpen(state, { payload }: PayloadAction<PortfolioOpenableFilterType>) {
      const index = state.openFilters.findIndex((filter) => filter === payload)
      index > -1 ? state.openFilters.splice(index, 1) : state.openFilters.push(payload)
    },
    clearFilters(state) {
      state.open = false
      state.search = ''
      state.status = []
      state.type = [...MY_DOMAINS_TYPE_FILTER_LABELS]
      state.length = { min: null, max: null }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = { min: null, max: null }
      state.categoryObjects = []
      state.openFilters = ['Status']
      state.sort = null
    },
  },
})

// Actions
export const {
  setFiltersOpen,
  setSearch,
  toggleFiltersStatus,
  setFiltersStatus,
  toggleFiltersType,
  setFiltersType,
  setFiltersLength,
  setPriceDenomination,
  setPriceRange,
  toggleCategory,
  setFiltersCategory,
  setSort,
  toggleFilterOpen,
  clearFilters,
} = profileDomainsFiltersSlice.actions

// Selectors
export const selectProfileDomainsFilters = (state: RootState) => state.filters.profileDomainsFilters

// Reducer
export default profileDomainsFiltersSlice.reducer