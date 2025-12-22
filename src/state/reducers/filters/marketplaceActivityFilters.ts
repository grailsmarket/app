import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { LengthType, PriceDenominationType, PriceType, SortFilterType } from '@/types/filters'
import { PROFILE_ACTIVITY_FILTERS } from '@/constants/filters/portfolioFilters'

// Types
export type MarketplaceActivityTypeFilterType = (typeof PROFILE_ACTIVITY_FILTERS)[number]['value']

export type MarketplaceActivityOpenableFilterType = 'Type'

export type MarketplaceActivityFiltersState = {
  type: MarketplaceActivityTypeFilterType[]
  search: string
  categories: string[]
  sort: SortFilterType | null
  denomination: PriceDenominationType
  priceRange: PriceType
  length: LengthType
  status: string[]
}

export type MarketplaceActivityFiltersOpenedState = MarketplaceActivityFiltersState & {
  openFilters: MarketplaceActivityOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export const emptyFilterState: MarketplaceActivityFiltersState = {
  type: [...PROFILE_ACTIVITY_FILTERS.map((item) => item.value)],
  search: '',
  categories: [],
  sort: null,
  denomination: 'ETH',
  priceRange: {
    min: null,
    max: null,
  },
  length: {
    min: null,
    max: null,
  },
  status: [],
}

// Initial State
export const initialState: MarketplaceActivityFiltersOpenedState = {
  open: false,
  type: [...PROFILE_ACTIVITY_FILTERS.map((item) => item.value)],
  openFilters: ['Type'],
  search: '',
  categories: [],
  sort: null,
  denomination: 'ETH',
  priceRange: {
    min: null,
    max: null,
  },
  length: {
    min: null,
    max: null,
  },
  status: [],
  scrollTop: 0,
}

// Slice
export const marketplaceActivityFiltersSlice = createSlice({
  name: 'marketplaceActivityFilters',
  initialState,
  reducers: {
    toggleMarketplaceActivityFiltersType(state, { payload }: PayloadAction<MarketplaceActivityTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setMarketplaceActivityFiltersType(state, { payload }: PayloadAction<MarketplaceActivityTypeFilterType>) {
      state.type = [payload]
    },
    toggleMarketplaceActivityFilterOpen(state, { payload }: PayloadAction<MarketplaceActivityOpenableFilterType>) {
      const index = state.openFilters.findIndex((filter) => filter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    setMarketplaceActivityFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setMarketplaceActivitySearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setMarketplaceActivityFiltersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    clearMarketplaceActivityFilters(state) {
      state.type = [...PROFILE_ACTIVITY_FILTERS.map((item) => item.value)]
      state.search = ''
    },
  },
})

// Actions
export const {
  toggleMarketplaceActivityFiltersType,
  setMarketplaceActivityFiltersType,
  clearMarketplaceActivityFilters,
  toggleMarketplaceActivityFilterOpen,
  setMarketplaceActivityFiltersOpen,
  setMarketplaceActivitySearch,
  setMarketplaceActivityFiltersScrollTop,
} = marketplaceActivityFiltersSlice.actions

// Selectors
export const selectMarketplaceActivityFilters = (state: RootState) => state.filters.marketplaceActivityFilters

// Reducer
export default marketplaceActivityFiltersSlice.reducer
