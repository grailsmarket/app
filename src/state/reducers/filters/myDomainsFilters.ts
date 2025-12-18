import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MY_DOMAINS_TYPE_FILTER_LABELS } from '@/constants/filters/portfolioFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  PortfolioFiltersState,
  PortfolioFiltersOpenedState,
  PortfolioStatusFilterType,
  PortfolioTypeFilterType,
  PortfolioOpenableFilterType,
  SortFilterType,
  PriceDenominationType,
  PriceType,
  LengthType,
} from '@/types/filters'

export const emptyFilterState: PortfolioFiltersState = {
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
  categories: [],
  sort: null,
}

// Initial State ------------------------------------
export const initialState: PortfolioFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
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
  categories: [],
  openFilters: ['Sort'],
  sort: 'expiry_date_asc',
  scrollTop: 0,
}

export type MyDomainsFiltersType = PortfolioFiltersState & {
  name: string
}

// Slice -------------------------------------------
export const myDomainsFiltersSlice = createSlice({
  name: 'myDomainsFilters',
  initialState,
  reducers: {
    setMyDomainsFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleMyDomainsFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setMyDomainsFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      state.status = [payload]
    },
    toggleMyDomainsFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setMyDomainsFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      state.type = [payload]
    },
    setMyDomainsFiltersLength(state, { payload }: PayloadAction<LengthType>) {
      state.length = payload
    },
    setMyDomainsPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setMyDomainsPriceRange(state, { payload }: PayloadAction<PriceType>) {
      state.priceRange = payload
    },
    toggleMyDomainsCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setMyDomainsFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setMyDomainsSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setMyDomainsSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setMyDomainsScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleMyDomainsFilterOpen(state, { payload }: PayloadAction<PortfolioOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearMyDomainsFilters(state) {
      state.open = false
      state.search = ''
      state.status = []
      state.type = [...MY_DOMAINS_TYPE_FILTER_LABELS]
      state.length = {
        min: null,
        max: null,
      }
      state.denomination = PRICE_DENOMINATIONS[0]
      state.priceRange = {
        min: null,
        max: null,
      }
      state.categories = []
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setMyDomainsFiltersOpen,
  toggleMyDomainsFiltersStatus,
  setMyDomainsFiltersStatus,
  toggleMyDomainsFiltersType,
  setMyDomainsFiltersType,
  setMyDomainsFiltersLength,
  setMyDomainsPriceDenomination,
  setMyDomainsPriceRange,
  toggleMyDomainsCategory,
  setMyDomainsFiltersCategory,
  setMyDomainsSort,
  setMyDomainsSearch,
  setMyDomainsScrollTop,
  toggleMyDomainsFilterOpen,
  clearMyDomainsFilters,
} = myDomainsFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMyDomainsFilters = (state: RootState) => state.filters.myDomainsFilters

// Reducer --------------------------------------------
export default myDomainsFiltersSlice.reducer
