import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { PROFILE_ACTIVITY_FILTERS } from '@/constants/filters/portfolioFilters'
import {
  CategoryActivityFiltersOpenedState,
  CategoryActivityFiltersState,
  CategoryActivityOpenableFilterType,
  CategoryActivityTypeFilterType,
} from './categoryActivityFilters'

export const emptyFilterState: CategoryActivityFiltersState = {
  type: [],
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
  type: [],
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
export const categoriesActivityFiltersSlice = createSlice({
  name: 'categoriesActivityFilters',
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
} = categoriesActivityFiltersSlice.actions

// Selectors
export const selectCategoriesActivityFilters = (state: RootState) => state.filters.categoriesActivityFilters

// Reducer
export default categoriesActivityFiltersSlice.reducer
