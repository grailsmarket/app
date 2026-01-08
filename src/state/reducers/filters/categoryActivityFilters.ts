import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { LengthType, PriceDenominationType, PriceType, SortFilterType } from '@/types/filters'
import { PROFILE_ACTIVITY_FILTERS } from '@/constants/filters/portfolioFilters'

// Types
export type CategoryActivityTypeFilterType = (typeof PROFILE_ACTIVITY_FILTERS)[number]['value']

export type CategoryActivityOpenableFilterType = 'Type'

export type CategoryActivityFiltersState = {
  type: CategoryActivityTypeFilterType[]
  search: string
  categories: string[]
  sort: SortFilterType | null
  denomination: PriceDenominationType
  priceRange: PriceType
  length: LengthType
  status: string[]
}

export type CategoryActivityFiltersOpenedState = CategoryActivityFiltersState & {
  openFilters: CategoryActivityOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export const emptyFilterState: CategoryActivityFiltersState = {
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
export const initialState: CategoryActivityFiltersOpenedState = {
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
export const categoryActivityFiltersSlice = createSlice({
  name: 'categoryActivityFilters',
  initialState,
  reducers: {
    toggleActivityFiltersType(state, { payload }: PayloadAction<CategoryActivityTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setActivityFiltersType(state, { payload }: PayloadAction<CategoryActivityTypeFilterType>) {
      state.type = [payload]
    },
    toggleFilterOpen(state, { payload }: PayloadAction<CategoryActivityOpenableFilterType>) {
      const index = state.openFilters.findIndex((filter) => filter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    setFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    setFiltersScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    clearActivityFilters(state) {
      state.type = [...PROFILE_ACTIVITY_FILTERS.map((item) => item.value)]
      state.search = ''
    },
  },
})

// Actions
export const {
  toggleActivityFiltersType,
  setActivityFiltersType,
  clearActivityFilters,
  toggleFilterOpen,
  setFiltersOpen,
  setSearch,
  setFiltersScrollTop,
} = categoryActivityFiltersSlice.actions

// Selectors
export const selectCategoryActivityFilters = (state: RootState) => state.filters.categoryActivityFilters

// Reducer
export default categoryActivityFiltersSlice.reducer
