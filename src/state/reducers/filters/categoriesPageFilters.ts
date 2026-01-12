import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import {
  CategoriesPageTypeOption,
  CategoriesPageSortOption,
  CategoriesPageSortDirection,
  CategoriesPageOpenableFilterType,
  DEFAULT_CATEGORIES_PAGE_SORT,
  DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION,
} from '@/constants/filters/categoriesPageFilters'

// Types --------------------------------------------
export type CategoriesPageFiltersState = {
  search: string
  type: CategoriesPageTypeOption | null
  sort: CategoriesPageSortOption
  sortDirection: CategoriesPageSortDirection
}

export type CategoriesPageFiltersOpenedState = CategoriesPageFiltersState & {
  openFilters: CategoriesPageOpenableFilterType[]
  open: boolean
  scrollTop: number
}

export const emptyFilterState: CategoriesPageFiltersState = {
  search: '',
  type: null,
  sort: DEFAULT_CATEGORIES_PAGE_SORT,
  sortDirection: DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION,
}

// Initial State ------------------------------------
export const initialState: CategoriesPageFiltersOpenedState = {
  open: false,
  search: '',
  type: null,
  sort: DEFAULT_CATEGORIES_PAGE_SORT,
  sortDirection: DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION,
  openFilters: ['Type'],
  scrollTop: 0,
}

// Slice -------------------------------------------
export const categoriesPageFiltersSlice = createSlice({
  name: 'categoriesPageFilters',
  initialState,
  reducers: {
    setCategoriesPageFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setCategoriesPageSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    toggleCategoriesPageType(state, { payload }: PayloadAction<CategoriesPageTypeOption>) {
      // If clicking the same type, deselect it (set to null)
      // Otherwise, select the new type
      state.type = state.type === payload ? null : payload
    },
    setCategoriesPageType(state, { payload }: PayloadAction<CategoriesPageTypeOption | null>) {
      state.type = payload
    },
    setCategoriesPageSort(state, { payload }: PayloadAction<CategoriesPageSortOption>) {
      state.sort = payload
    },
    setCategoriesPageSortDirection(state, { payload }: PayloadAction<CategoriesPageSortDirection>) {
      state.sortDirection = payload
    },
    toggleCategoriesPageFilterOpen(state, { payload }: PayloadAction<CategoriesPageOpenableFilterType>) {
      const index = state.openFilters.findIndex((openFilter) => openFilter === payload)
      if (index > -1) {
        state.openFilters.splice(index, 1)
      } else {
        state.openFilters.push(payload)
      }
    },
    setCategoriesPageScrollTop(state, { payload }: PayloadAction<number>) {
      state.scrollTop = payload
    },
    clearCategoriesPageFilters(state) {
      state.search = ''
      state.type = null
      state.sort = DEFAULT_CATEGORIES_PAGE_SORT
      state.sortDirection = DEFAULT_CATEGORIES_PAGE_SORT_DIRECTION
      state.openFilters = ['Type']
    },
  },
})

// Actions --------------------------------------------
export const {
  setCategoriesPageFiltersOpen,
  setCategoriesPageSearch,
  toggleCategoriesPageType,
  setCategoriesPageType,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
  toggleCategoriesPageFilterOpen,
  setCategoriesPageScrollTop,
  clearCategoriesPageFilters,
} = categoriesPageFiltersSlice.actions

// Selectors ------------------------------------------
export const selectCategoriesPageFilters = (state: RootState) => state.filters.categoriesPageFilters

// Reducer --------------------------------------------
export default categoriesPageFiltersSlice.reducer
