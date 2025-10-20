import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  ALL_SORT_FILTERS,
  YOUR_DOMAINS_FILTER_LABELS,
  OFFERS_STATUS_FILTER_LABELS,
  MARKETPLACE_CATEGORY_OBJECTS,
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

type MarketplaceCategoryObjectType = (typeof MARKETPLACE_CATEGORY_OBJECTS)[number]

export type MarketplaceCategoryType = MarketplaceCategoryObjectType['category']

export type MarketplaceSubcategoryType = MarketplaceCategoryObjectType['subcategory']

export type MarketplaceOpenableFilterType = (typeof MARKETPLACE_OPENABLE_FILTERS)[number]

export type SortFilterType = (typeof ALL_SORT_FILTERS)[number]

export type MarketplaceFiltersState = {
  open: boolean
  search: string
  status: MarketplaceStatusFilterType[]
  type: MarketplaceTypeFilterType[]
  length: MarketplaceLengthType
  denomination: PriceDenominationType
  priceRange: MarketplacePriceType
  categoryObjects: MarketplaceCategoryObjectType[]
  sort: SortFilterType | null
}

export type MarketplaceFiltersOpenedState = MarketplaceFiltersState & {
  openFilters: MarketplaceOpenableFilterType[]
}

export const emptyFilterState: MarketplaceFiltersState = {
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
  categoryObjects: [],
  sort: null,
}

// Initial State ------------------------------------
export const initialState: MarketplaceFiltersOpenedState = {
  // Filters are only expandable on mobile and tablet, so this value will get ignored on desktop
  open: false,
  search: '',
  status: ['Listed'],
  type: [MARKETPLACE_TYPE_FILTER_LABELS[0]],
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
  sort: null,
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
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setMarketplaceFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      state.status = [payload]
    },
    toggleMarketplaceFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
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
    toggleMarketplaceCategory(state, { payload }: PayloadAction<MarketplaceCategoryType>) {
      const isFilterIncludesPayload = state.categoryObjects.map(({ category }) => category).includes(payload)

      if (isFilterIncludesPayload) {
        state.categoryObjects = state.categoryObjects.filter(({ category }) => category !== payload)
      } else {
        state.categoryObjects.push(...MARKETPLACE_CATEGORY_OBJECTS.filter(({ category }) => category === payload))
      }
    },
    setMarketplaceFiltersCategory(state, { payload }: PayloadAction<MarketplaceCategoryType>) {
      state.categoryObjects = MARKETPLACE_CATEGORY_OBJECTS.filter(({ category }) => category === payload)
    },
    setMarketplaceFiltersSubcategory(state, { payload }: PayloadAction<string>) {
      state.categoryObjects = MARKETPLACE_CATEGORY_OBJECTS.filter(({ subcategory }) => subcategory === payload)
    },
    toggleMarketplaceSubcategory(
      state,
      {
        payload: { subcategory, category },
      }: PayloadAction<{
        subcategory: MarketplaceSubcategoryType
        category: MarketplaceCategoryType
      }>
    ) {
      const isFilterIncludesPayload = state.categoryObjects.some(
        ({ category: _category, subcategory: _subcategory }) => _subcategory === subcategory && _category === category
      )

      if (isFilterIncludesPayload) {
        state.categoryObjects = state.categoryObjects.filter(
          ({ category: _category, subcategory: _subcategory }) => _category !== category || _subcategory !== subcategory
        )
      } else {
        const categoryObject = MARKETPLACE_CATEGORY_OBJECTS.find(
          ({ category: _category, subcategory: _subcategory }) => _category === category && _subcategory === subcategory
        )

        if (categoryObject) {
          state.categoryObjects.push(categoryObject)
        }
      }
    },
    setMarketplaceSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setMarketplaceSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
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
      state.open = false
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
      state.categoryObjects = []
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
  toggleMarketplaceSubcategory,
  setMarketplaceFiltersCategory,
  setMarketplaceFiltersSubcategory,
  setMarketplaceSort,
  setMarketplaceSearch,
  toggleMarketplaceFilterOpen,
  clearMarketplaceFilters,
} = marketplaceFiltersSlice.actions

// Selectors ------------------------------------------
export const selectMarketplaceFilters = (state: RootState) => state.filters.marketplaceFilters

// Reducer --------------------------------------------
export default marketplaceFiltersSlice.reducer
