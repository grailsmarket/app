import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'
import { LengthType, PriceDenominationType, PriceType, SortFilterType } from '@/types/filters'
import { PROFILE_ACTIVITY_FILTERS } from '@/constants/filters/portfolioFilters'

// Types
export type ActivityTypeFilterType = (typeof PROFILE_ACTIVITY_FILTERS)[number]['value']

export type ProfileActivityOpenableFilterType = 'Type'

export type ActivityFiltersState = {
  type: ActivityTypeFilterType[]
  search: string
  categories: string[]
  sort: SortFilterType | null
  denomination: PriceDenominationType
  priceRange: PriceType
  length: LengthType
  status: string[]
}

export type ActivityFiltersOpenedState = ActivityFiltersState & {
  openFilters: ProfileActivityOpenableFilterType[]
  open: boolean
}

export const emptyFilterState: ActivityFiltersState = {
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
export const initialState: ActivityFiltersOpenedState = {
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
}

// Slice
export const profileActivityFiltersSlice = createSlice({
  name: 'profileActivityFilters',
  initialState,
  reducers: {
    toggleActivityFiltersType(state, { payload }: PayloadAction<ActivityTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      if (index > -1) {
        state.type.splice(index, 1)
      } else {
        state.type.push(payload)
      }
    },
    setActivityFiltersType(state, { payload }: PayloadAction<ActivityTypeFilterType>) {
      state.type = [payload]
    },
    toggleFilterOpen(state, { payload }: PayloadAction<ProfileActivityOpenableFilterType>) {
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
} = profileActivityFiltersSlice.actions

// Selectors
export const selectProfileActivityFilters = (state: RootState) => state.filters.profileActivityFilters

// Reducer
export default profileActivityFiltersSlice.reducer
