import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { MARKETPLACE_CATEGORY_OBJECTS, MARKETPLACE_TYPE_FILTER_LABELS } from '@/constants/filters/marketplaceFilters'
import { PRICE_DENOMINATIONS } from '@/constants/filters'
import {
  MarketplaceCategoryType,
  MarketplaceFiltersOpenedState,
  MarketplaceFiltersState,
  MarketplaceLengthType,
  MarketplaceOpenableFilterType,
  MarketplacePriceType,
  MarketplaceStatusFilterType,
  MarketplaceSubcategoryType,
  MarketplaceTypeFilterType,
  PriceDenominationType,
  SortFilterType,
} from './marketplaceFilters'

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
export const watchlistFiltersSlice = createSlice({
  name: 'watchlistFilters',
  initialState,
  reducers: {
    setWatchlistFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    toggleWatchlistFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      const index = state.status.findIndex((_status) => _status === payload)
      if (index > -1) {
        state.status.splice(index, 1)
      } else {
        state.status.push(payload)
      }
    },
    setWatchlistFiltersStatus(state, { payload }: PayloadAction<MarketplaceStatusFilterType>) {
      state.status = [payload]
    },
    toggleWatchlistFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setWatchlistFiltersType(state, { payload }: PayloadAction<MarketplaceTypeFilterType>) {
      state.type = [payload]
    },
    setWatchlistFiltersLength(state, { payload }: PayloadAction<MarketplaceLengthType>) {
      state.length = payload
    },
    setWatchlistPriceDenomination(state, { payload }: PayloadAction<PriceDenominationType>) {
      state.priceRange = { min: null, max: null }
      state.denomination = payload
    },
    setWatchlistPriceRange(state, { payload }: PayloadAction<MarketplacePriceType>) {
      state.priceRange = payload
    },
    toggleWatchlistCategory(state, { payload }: PayloadAction<MarketplaceCategoryType>) {
      const isFilterIncludesPayload = state.categoryObjects.map(({ category }) => category).includes(payload)

      if (isFilterIncludesPayload) {
        state.categoryObjects = state.categoryObjects.filter(({ category }) => category !== payload)
      } else {
        state.categoryObjects.push(...MARKETPLACE_CATEGORY_OBJECTS.filter(({ category }) => category === payload))
      }
    },
    setWatchlistFiltersCategory(state, { payload }: PayloadAction<MarketplaceCategoryType>) {
      state.categoryObjects = MARKETPLACE_CATEGORY_OBJECTS.filter(({ category }) => category === payload)
    },
    setWatchlistFiltersSubcategory(state, { payload }: PayloadAction<string>) {
      state.categoryObjects = MARKETPLACE_CATEGORY_OBJECTS.filter(({ subcategory }) => subcategory === payload)
    },
    toggleWatchlistSubcategory(
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
    setWatchlistSort(state, { payload }: PayloadAction<SortFilterType | null>) {
      state.sort = payload
    },
    setWatchlistSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    toggleWatchlistFilterOpen(state, { payload }: PayloadAction<MarketplaceOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    clearWatchlistFilters(state) {
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
  setWatchlistFiltersOpen,
  toggleWatchlistFiltersStatus,
  setWatchlistFiltersStatus,
  toggleWatchlistFiltersType,
  setWatchlistFiltersType,
  setWatchlistFiltersLength,
  setWatchlistPriceDenomination,
  setWatchlistPriceRange,
  toggleWatchlistCategory,
  toggleWatchlistSubcategory,
  setWatchlistFiltersCategory,
  setWatchlistFiltersSubcategory,
  setWatchlistSort,
  setWatchlistSearch,
  toggleWatchlistFilterOpen,
  clearWatchlistFilters,
} = watchlistFiltersSlice.actions

// Selectors ------------------------------------------
export const selectWatchlistFilters = (state: RootState) => state.filters.watchlistFilters

// Reducer --------------------------------------------
export default watchlistFiltersSlice.reducer
