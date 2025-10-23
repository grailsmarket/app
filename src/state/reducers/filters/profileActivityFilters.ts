import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../index'

const PROFILE_ACTIVITY_FILTER_LABELS = ['Sale', 'Transfer', 'Offer', 'Mint', 'Listing'] as const

// Types
export type ActivityTypeFilterType = (typeof PROFILE_ACTIVITY_FILTER_LABELS)[number]

export type ProfileActivityOpenableFilterType = 'Type'

type ActivityFiltersState = {
  open: boolean
  type: ActivityTypeFilterType[]
  search: string
}

export type ActivityFiltersOpenedState = ActivityFiltersState & {
  openFilters: ProfileActivityOpenableFilterType[]
}

// Initial State
export const initialState: ActivityFiltersOpenedState = {
  open: false,
  type: [...PROFILE_ACTIVITY_FILTER_LABELS],
  openFilters: ['Type'],
  search: '',
}

// Slice
export const profileActivityFiltersSlice = createSlice({
  name: 'profileActivityFilters',
  initialState,
  reducers: {
    toggleActivityFiltersType(state, { payload }: PayloadAction<ActivityTypeFilterType>) {
      const index = state.type.findIndex((type) => type === payload)
      index > -1 ? state.type.splice(index, 1) : state.type.push(payload)
    },
    setActivityFiltersType(state, { payload }: PayloadAction<ActivityTypeFilterType>) {
      state.type = [payload]
    },
    toggleFilterOpen(state, { payload }: PayloadAction<ProfileActivityOpenableFilterType>) {
      const index = state.openFilters.findIndex((filter) => filter === payload)
      index > -1 ? state.openFilters.splice(index, 1) : state.openFilters.push(payload)
    },
    setFiltersOpen(state, { payload }: PayloadAction<boolean>) {
      state.open = payload
    },
    setSearch(state, { payload }: PayloadAction<string>) {
      state.search = payload
    },
    clearActivityFilters(state) {
      state.type = [...PROFILE_ACTIVITY_FILTER_LABELS]
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
