import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MY_DOMAINS_TYPE_FILTER_LABELS } from '@/constants/filters/portfolioFilters'
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
  type: [MY_DOMAINS_TYPE_FILTER_LABELS[0]],
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
  openFilters: ['Status'],
  sort: 'price_high_to_low',
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
  toggleReceivedOffersFilterOpen,
  clearReceivedOffersFilters,
} = receivedOffersFiltersSlice.actions

// Selectors ------------------------------------------
export const selectReceivedOffersFilters = (state: RootState) => state.filters.receivedOffersFilters

// Reducer --------------------------------------------
export default receivedOffersFiltersSlice.reducer
