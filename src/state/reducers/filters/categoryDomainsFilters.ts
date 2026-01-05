import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import { MY_DOMAINS_TYPE_FILTER_LABELS } from '@/constants/filters/portfolioFilters'
import {
  PortfolioFiltersOpenedState,
  PortfolioStatusFilterType,
  PortfolioTypeFilterType,
  PortfolioOpenableFilterType,
  SortFilterType,
  PriceDenominationType,
  PriceType,
  LengthType,
  PortfolioFiltersState,
} from '@/types/filters'

export const emptyFilterState: PortfolioFiltersState = {
  search: '',
  status: [],
  type: [],
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categories: [],
  sort: null,
}

// Initial State
export const initialState: PortfolioFiltersOpenedState = {
  open: false,
  search: '',
  status: [],
  type: [],
  length: {
    min: null,
    max: null,
  },
  denomination: PRICE_DENOMINATIONS[0],
  priceRange: {
    min: null,
    max: null,
  },
  categories: [],
  openFilters: ['Sort', 'Status', 'Type', 'Length', 'Price Range'],
  sort: null,
  scrollTop: 0,
}

// Slice
export const categoryDomainsFiltersSlice = createSlice({
  name: 'categoryDomainsFilters',
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
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      state.status = [payload]
    },
    toggleFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
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
    toggleCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setFiltersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleFilterOpen(state, { payload }: PayloadAction<PortfolioOpenableFilterType>) {
      const index = state.openFilters.findIndex((filter) => filter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearFilters(state) {
      state.search = ''
      state.status = []
      state.type = [...MY_DOMAINS_TYPE_FILTER_LABELS]
      state.length = { min: null, max: null }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = { min: null, max: null }
      state.categories = []
      state.openFilters = ['Sort', 'Status', 'Type', 'Length', 'Price Range']
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
  setFiltersScrollTop,
  toggleFilterOpen,
  clearFilters,
} = categoryDomainsFiltersSlice.actions

// Selectors
export const selectCategoryDomainsFilters = (state: RootState) => state.filters.categoryDomainsFilters

// Reducer
export default categoryDomainsFiltersSlice.reducer
