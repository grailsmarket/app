import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ALL_SORT_FILTERS,
  MY_DOMAINS_FILTER_LABELS,
  MY_OFFERS_STATUS_FILTER_LABELS,
  MY_DOMAINS_OPENABLE_FILTERS,
  MY_DOMAINS_TYPE_FILTER_LABELS,
  MY_DOMAINS_STATUS_FILTER_LABELS,
  MY_DOMAINS_CATEGORIES,
} from '@/constants/filters/portfolioFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  DEFAULT_TYPE_FILTERS_STATE,
  DEFAULT_MARKET_FILTERS_STATE,
  TypeFilterOption,
  MarketplaceTypeFilterLabel,
  TypeFiltersState,
  MarketFiltersState,
} from '@/constants/filters/marketplaceFilters'

// Types --------------------------------------------
export type MyDomainsStatusFilterType =
  | (typeof MY_DOMAINS_STATUS_FILTER_LABELS)[number]
  | (typeof MY_OFFERS_STATUS_FILTER_LABELS)[number]
  | (typeof MY_DOMAINS_FILTER_LABELS)[number]

export type ProfileOffersStatusFilterType = (typeof MY_OFFERS_STATUS_FILTER_LABELS)[number]

export type ProfileDomainsStatusFilterType = (typeof MY_DOMAINS_FILTER_LABELS)[number]

export type MyDomainsTypeFilterType = (typeof MY_DOMAINS_TYPE_FILTER_LABELS)[number]

type MyDomainsLengthType = {
  min: number | null
  max: number | null
}

type MyDomainsPriceType = {
  min: number | null
  max: number | null
}

export type PriceDenominationType = (typeof PRICE_DENOMINATIONS)[number]

export type MyDomainsCategoryType = (typeof MY_DOMAINS_CATEGORIES)[number]

export type MyDomainsOpenableFilterType = (typeof MY_DOMAINS_OPENABLE_FILTERS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]

export type MyDomainsFiltersState = {
  search: string
  status: MyDomainsStatusFilterType[]
  market: MarketFiltersState
  type: TypeFiltersState
  length: MyDomainsLengthType
  denomination: PriceDenominationType
  priceRange: MyDomainsPriceType
  categories: string[]
  sort: SortFilterType | null
}

export type MyDomainsFiltersOpenedState = MyDomainsFiltersState & {
  openFilters: MyDomainsOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export const emptyFilterState: MyDomainsFiltersState = {
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
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
export const initialState: MyDomainsFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
  open: false,
  search: '',
  status: [],
  market: { ...DEFAULT_MARKET_FILTERS_STATE },
  type: { ...DEFAULT_TYPE_FILTERS_STATE },
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
  openFilters: ['Sort', 'Status', 'Market', 'Type', 'Length', 'Price Range'],
  sort: null,
  scrollTop: 0,
}

export type MyDomainsFiltersType = MyDomainsFiltersState & {
  name: string
}

// Slice -------------------------------------------
export const myOffersFiltersSlice = createSlice({
  name: 'myOffersFilters',
  initialState,
  reducers: {
    setMyOffersFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleMyOffersFiltersStatus(state, { payload }: PayloadAction<MyDomainsStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setMyOffersFiltersStatus(state, { payload }: PayloadAction<MyDomainsStatusFilterType>) {
      state.status = [payload]
    },
    setMyOffersTypeFilter(
      state,
      { payload }: PayloadAction<{ label: MarketplaceTypeFilterLabel; option: TypeFilterOption }>
    ) {
      const { label, option } = payload
      if (option === 'only') {
        state.type = { ...DEFAULT_TYPE_FILTERS_STATE, [label]: 'only' }
      } else {
        state.type[label] = option
      }
    },
    toggleMyOffersFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterLabel>) {
      state.type[payload] = state.type[payload] === 'none' ? 'include' : 'none'
    },
    setMyOffersFiltersType(state, { payload }: PayloadAction<TypeFiltersState>) {
      state.type = payload
    },
    setMyOffersMarketFilters(state, { payload }: PayloadAction<MarketFiltersState>) {
      state.market = payload
    },
    setMyOffersFiltersLength(state, { payload }: PayloadAction<MyDomainsLengthType>) {
      state.length = payload
    },
    setMyOffersPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setMyOffersPriceRange(state, { payload }: PayloadAction<MyDomainsPriceType>) {
      state.priceRange = payload
    },
    toggleMyOffersCategory(state, { payload }: PayloadAction<string>) {
      const isFilterIncludesPayload = state.categories.includes(payload)

      if (isFilterIncludesPayload) {
        state.categories = state.categories.filter((category) => category !== payload)
      } else {
        state.categories.push(payload)
      }
    },
    setMyOffersFiltersCategory(state, { payload }: PayloadAction<string>) {
      state.categories = [payload]
    },
    setMyOffersSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setMyOffersSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setMyOffersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    toggleMyOffersFilterOpen(state, { payload }: PayloadAction<MyDomainsOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearMyOffersFilters(state) {
      state.search = ''
      state.status = []
      state.market = { ...DEFAULT_MARKET_FILTERS_STATE }
      state.type = { ...DEFAULT_TYPE_FILTERS_STATE }
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
      state.openFilters = ['Sort', 'Status', 'Market', 'Type', 'Length', 'Price Range']
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setMyOffersFiltersOpen,
  toggleMyOffersFiltersStatus,
  setMyOffersFiltersStatus,
  setMyOffersTypeFilter,
  toggleMyOffersFiltersType,
  setMyOffersFiltersType,
  setMyOffersMarketFilters,
  setMyOffersFiltersLength,
  setMyOffersPriceDenomination,
  setMyOffersPriceRange,
  toggleMyOffersCategory,
  setMyOffersFiltersCategory,
  setMyOffersSort,
  setMyOffersSearch,
  setMyOffersScrollTop,
  toggleMyOffersFilterOpen,
  clearMyOffersFilters,
} = myOffersFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMyOffersFilters = (state: RootState) => state.filters.myOffersFilters

// Reducer --------------------------------------------
export default myOffersFiltersSlice.reducer
