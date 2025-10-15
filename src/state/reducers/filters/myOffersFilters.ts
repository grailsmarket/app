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
  open: boolean
  status: MyDomainsStatusFilterType[]
  type: MyDomainsTypeFilterType[]
  length: MyDomainsLengthType
  denomination: PriceDenominationType
  priceRange: MyDomainsPriceType
  categoryObjects: MyDomainsCategoryType[]
  sort: SortFilterType | null
}

export type MyDomainsFiltersOpenedState = MyDomainsFiltersState & {
  openFilters: MyDomainsOpenableFilterType[]
}

export const emptyFilterState: MyDomainsFiltersState = {
  open: false,
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
  sort: null,
}

// Initial State ------------------------------------
export const initialState: MyDomainsFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
  open: false,
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
  categoryObjects: [],
  openFilters: ['Status'],
  sort: 'price_high_to_low',
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
    toggleMyOffersFiltersType(state, { payload }: PayloadAction<MyDomainsTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setMyOffersFiltersType(state, { payload }: PayloadAction<MyDomainsTypeFilterType>) {
      state.type = [payload]
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
    toggleMyOffersCategory(state, { payload }: PayloadAction<MyDomainsCategoryType>) {
      const isFilterIncludesPayload = state.categoryObjects.includes(payload)

      if (isFilterIncludesPayload) {
        state.categoryObjects = state.categoryObjects.filter((category) => category !== payload)
      } else {
        state.categoryObjects.push(...MY_DOMAINS_CATEGORIES.filter((category) => category === payload))
      }
    },
    setMyOffersFiltersCategory(state, { payload }: PayloadAction<MyDomainsCategoryType>) {
      state.categoryObjects = MY_DOMAINS_CATEGORIES.filter((category) => category === payload)
    },
    setMyOffersSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
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
      state.open = false
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
      state.categoryObjects = []
      state.sort = null
    },
  },
})

// Actions --------------------------------------------
export const {
  setMyOffersFiltersOpen,
  toggleMyOffersFiltersStatus,
  setMyOffersFiltersStatus,
  toggleMyOffersFiltersType,
  setMyOffersFiltersType,
  setMyOffersFiltersLength,
  setMyOffersPriceDenomination,
  setMyOffersPriceRange,
  toggleMyOffersCategory,
  setMyOffersFiltersCategory,
  setMyOffersSort,
  toggleMyOffersFilterOpen,
  clearMyOffersFilters,
} = myOffersFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMyOffersFilters = (state: RootState) => state.filters.myOffersFilters

// Reducer --------------------------------------------
export default myOffersFiltersSlice.reducer
