import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  LengthType,
  PortfolioFiltersOpenedState,
  PortfolioFiltersState,
  PortfolioOpenableFilterType,
  PortfolioStatusFilterType,
  PortfolioTypeFilterType,
  PriceDenominationType,
  PriceType,
  SortFilterType,
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

// Initial State ------------------------------------
export const initialState: PortfolioFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
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

// Slice -------------------------------------------
export const receivedOffersFiltersSlice = createSlice({
  name: 'receivedOffersFilters',
  initialState,
  reducers: {
    setReceivedOffersFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleReceivedOffersFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setReceivedOffersFiltersStatus(state, { payload }: PayloadAction<PortfolioStatusFilterType>) {
      state.status = [payload]
    },
    toggleReceivedOffersFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setReceivedOffersFiltersType(state, { payload }: PayloadAction<PortfolioTypeFilterType>) {
      state.type = [payload]
    },
    setReceivedOffersFiltersLength(state, { payload }: PayloadAction<LengthType>) {
      state.length = payload
    },
    setReceivedOffersPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setReceivedOffersPriceRange(state, { payload }: PayloadAction<PriceType>) {
      state.priceRange = payload
    },
    toggleReceivedOffersCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setReceivedOffersFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setReceivedOffersSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setReceivedOffersSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setReceivedOffersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleReceivedOffersFilterOpen(state, { payload }: PayloadAction<PortfolioOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearReceivedOffersFilters(state) {
      state.search = ''
      state.status = []
      state.type = []
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
      state.openFilters = ['Sort', 'Status', 'Type', 'Length', 'Price Range']
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setReceivedOffersFiltersOpen,
  toggleReceivedOffersFiltersStatus,
  setReceivedOffersFiltersStatus,
  toggleReceivedOffersFiltersType,
  setReceivedOffersFiltersType,
  setReceivedOffersFiltersLength,
  setReceivedOffersPriceDenomination,
  setReceivedOffersPriceRange,
  toggleReceivedOffersCategory,
  setReceivedOffersFiltersCategory,
  setReceivedOffersSort,
  setReceivedOffersSearch,
  setReceivedOffersScrollTop,
  toggleReceivedOffersFilterOpen,
  clearReceivedOffersFilters,
} = receivedOffersFiltersSlice.actions

// Selectors ------------------------------------------
export const selectReceivedOffersFilters = (state: RootState) => state.filters.receivedOffersFilters

// Reducer --------------------------------------------
export default receivedOffersFiltersSlice.reducer
