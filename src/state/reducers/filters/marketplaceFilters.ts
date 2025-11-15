import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ALL_SORT_FILTERS,
  YOUR_DOMAINS_FILTER_LABELS,
  OFFERS_STATUS_FILTER_LABELS,
  MARKETPLACE_OPENABLE_FILTERS,
  MARKETPLACE_TYPE_FILTER_LABELS,
  MARKETPLACE_STATUS_FILTER_LABELS,
} from '@/constants/filters/marketplaceFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'

// Types --------------------------------------------
export type MarketplaceStatusFilterType =
  | (typeof MARKETPLACE_STATUS_FILTER_LABELS)[number]
  | (typeof OFFERS_STATUS_FILTER_LABELS)[number]
  | (typeof YOUR_DOMAINS_FILTER_LABELS)[number]

export type ProfileOffersStatusFilterType = (typeof OFFERS_STATUS_FILTER_LABELS)[number]

export type ProfileDomainsStatusFilterType = (typeof YOUR_DOMAINS_FILTER_LABELS)[number]

export type MarketplaceTypeFilterType = (typeof MARKETPLACE_TYPE_FILTER_LABELS)[number]

export type MarketplaceLengthType = {
  min: number | null
  max: number | null
}

export type MarketplacePriceType = {
  min: number | null
  max: number | null
}

export type PriceDenominationType = (typeof PRICE_DENOMINATIONS)[number]

export type MarketplaceCategoryType = string

export type MarketplaceOpenableFilterType = (typeof MARKETPLACE_OPENABLE_FILTERS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]

export type MarketplaceFiltersState = {
  search: string
  status: MarketplaceStatusFilterType[]
  type: MarketplaceTypeFilterType[]
  length: MarketplaceLengthType
  denomination: PriceDenominationType
  priceRange: MarketplacePriceType
  categories: string[]
  sort: SortFilterType | null
}

export type MarketplaceFiltersOpenedState = MarketplaceFiltersState & {
  openFilters: MarketplaceOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export const emptyFilterState: MarketplaceFiltersState = {
  search: '',
  status: [],
  type: [...MARKETPLACE_TYPE_FILTER_LABELS],
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
export const initialState: MarketplaceFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
  open: false,
  search: '',
  status: [],
  type: [...MARKETPLACE_TYPE_FILTER_LABELS],
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
  sort: null,
  scrollTop: 0,
}

export type MarketplaceFiltersType = MarketplaceFiltersState & {
  name: string
}

// Slice -------------------------------------------
export const marketplaceFiltersSlice = createSlice({
  name: 'marketplaceFilters',
  initialState,
  reducers: {
    setMarketplaceFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleMarketplaceFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      if (state.status.includes(payload)) {
        state.status = state.status.filter((status) => status !== payload)
      } else {
        state.status.push(payload)
      }
    },
    setMarketplaceFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      state.status = [payload]
    },
    toggleMarketplaceFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      if (state.type.includes(payload)) {
        state.type = state.type.filter((type) => type !== payload)
      } else {
        state.type = state.type.concat(payload)
      }
    },
    setMarketplaceFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      state.type = [payload]
    },
    setMarketplaceFiltersLength(state, { payload }: PayloadAction<MarketplaceLengthType>) {
      state.length = payload
    },
    setMarketplacePriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setMarketplacePriceRange(state, { payload }: PayloadAction<MarketplacePriceType>) {
      state.priceRange = payload
    },
    toggleMarketplaceCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setMarketplaceFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setMarketplaceSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setMarketplaceSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setMarketplaceScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleMarketplaceFilterOpen(state, { payload }: PayloadAction<MarketplaceOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearMarketplaceFilters(state) {
      state.search = ''
      state.status = []
      state.type = [...MARKETPLACE_TYPE_FILTER_LABELS]
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
      state.openFilters = ['Status']
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setMarketplaceFiltersOpen,
  toggleMarketplaceFiltersStatus,
  setMarketplaceFiltersStatus,
  toggleMarketplaceFiltersType,
  setMarketplaceFiltersType,
  setMarketplaceFiltersLength,
  setMarketplacePriceDenomination,
  setMarketplacePriceRange,
  toggleMarketplaceCategory,
  setMarketplaceFiltersCategory,
  setMarketplaceSort,
  setMarketplaceSearch,
  setMarketplaceScrollTop,
  toggleMarketplaceFilterOpen,
  clearMarketplaceFilters,
} = marketplaceFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMarketplaceFilters = (state: RootState) => state.filters.marketplaceFilters

// Reducer --------------------------------------------
export default marketplaceFiltersSlice.reducer
