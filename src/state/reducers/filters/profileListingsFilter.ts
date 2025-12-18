import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import { MY_DOMAINS_TYPE_FILTER_LABELS } from '@/constants/filters/portfolioFilters'
import {
  PortfolioFiltersOpenedState,
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
  type: [...MY_DOMAINS_TYPE_FILTER_LABELS],
  status: ['Listed'],
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
  type: [...MY_DOMAINS_TYPE_FILTER_LABELS],
  status: ['Listed'],
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
  openFilters: ['Sort'],
  sort: 'price_asc',
  scrollTop: 0,
}

// Slice
export const profileListingsFiltersSlice = createSlice({
  name: 'profileListingsFilters',
  initialState,
  reducers: {
    setFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    toggleFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      if (state.type.includes(payload)) {
        state.type = state.type.filter((type) => type !== payload)
      } else {
        state.type = state.type.concat(payload)
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
      state.type = [...MY_DOMAINS_TYPE_FILTER_LABELS]
      state.length = { min: null, max: null }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = { min: null, max: null }
      state.categories = []
      state.openFilters = ['Sort']
      state.sort = null
    },
  },
})

// Actions
export const {
  setFiltersOpen,
  setSearch,
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
} = profileListingsFiltersSlice.actions

// Selectors
export const selectProfileListingsFilters = (state: RootState) => state.filters.profileListingsFilters

// Reducer
export default profileListingsFiltersSlice.reducer
