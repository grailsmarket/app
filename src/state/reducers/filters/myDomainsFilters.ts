import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ALL_SORT_FILTERS,
  YOUR_DOMAINS_FILTER_LABELS,
  OFFERS_STATUS_FILTER_LABELS,
  MY_DOMAINS_OPENABLE_FILTERS,
  MY_DOMAINS_TYPE_FILTER_LABELS,
  MY_DOMAINS_STATUS_FILTER_LABELS,
  MY_DOMAINS_CATEGORIES,
} from '@/constants/filters/myDomainsFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'

// Types --------------------------------------------
export type MyDomainsStatusFilterType =
  | (typeof MY_DOMAINS_STATUS_FILTER_LABELS)[number]
  | (typeof OFFERS_STATUS_FILTER_LABELS)[number]
  | (typeof YOUR_DOMAINS_FILTER_LABELS)[number]

export type ProfileOffersStatusFilterType = (typeof OFFERS_STATUS_FILTER_LABELS)[number]

export type ProfileDomainsStatusFilterType = (typeof YOUR_DOMAINS_FILTER_LABELS)[number]

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
export const myDomainsFiltersSlice = createSlice({
  name: 'myDomainsFilters',
  initialState,
  reducers: {
    setMyDomainsFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleMyDomainsFiltersStatus(state, { payload }: PayloadAction<MyDomainsStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setMyDomainsFiltersStatus(state, { payload }: PayloadAction<MyDomainsStatusFilterType>) {
      state.status = [payload]
    },
    toggleMyDomainsFiltersType(state, { payload }: PayloadAction<MyDomainsTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setMyDomainsFiltersType(state, { payload }: PayloadAction<MyDomainsTypeFilterType>) {
      state.type = [payload]
    },
    setMyDomainsFiltersLength(state, { payload }: PayloadAction<MyDomainsLengthType>) {
      state.length = payload
    },
    setMyDomainsPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setMyDomainsPriceRange(state, { payload }: PayloadAction<MyDomainsPriceType>) {
      state.priceRange = payload
    },
    toggleMyDomainsCategory(state, { payload }: PayloadAction<MyDomainsCategoryType>) {
      const isFilterIncludesPayload = state.categoryObjects.includes(payload)

      if (isFilterIncludesPayload) {
        state.categoryObjects = state.categoryObjects.filter((category) => category !== payload)
      } else {
        state.categoryObjects.push(...MY_DOMAINS_CATEGORIES.filter((category) => category === payload))
      }
    },
    setMyDomainsFiltersCategory(state, { payload }: PayloadAction<MyDomainsCategoryType>) {
      state.categoryObjects = MY_DOMAINS_CATEGORIES.filter((category) => category === payload)
    },
    setMyDomainsSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    toggleMyDomainsFilterOpen(state, { payload }: PayloadAction<MyDomainsOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearMyDomainsFilters(state) {
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
  toggleMyDomainsFilterOpen,
  clearMyDomainsFilters,
} = myDomainsFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMyDomainsFilters = (state: RootState) => state.filters.myDomainsFilters

// Reducer --------------------------------------------
export default myDomainsFiltersSlice.reducer
