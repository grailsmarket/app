import { ActivityFiltersOpenedState, ActivityFiltersState, ActivityTypeFilterType } from '@/types/filters/activity'
import { PayloadAction } from '@reduxjs/toolkit'

export const ACTIVITY_TYPE_FILTERS_LABELS = [
  'Sale',
  'Transfer',
  'Offer',
  'Mint',
  'Listing',
  'Bought',
  'Sold',
  'Offer Accepted',
  'Offer Cancelled',
  'Listing Cancelled',
  'Minted',
  'Burned',
  'Sent',
  'Received',
  'Registration',
] as const

export const ACTIVITY_TYPE_FILTERS = [
  { label: 'Listing', value: 'listed' },
  { label: 'Bought', value: 'bought' },
  { label: 'Sold', value: 'sold' },
  { label: 'Offer', value: 'offer_made' },
  { label: 'Offer Accepted', value: 'offer_accepted' },
  { label: 'Offer Cancelled', value: 'offer_cancelled' },
  { label: 'Listing Cancelled', value: 'listing_cancelled' },
  { label: 'Minted', value: 'mint' },
  { label: 'Extended', value: 'renewal' },
  { label: 'Sent', value: 'sent' },
  { label: 'Received', value: 'received' },
] as const

export const DEFAULT_ACTIVITY_FILTERS_STATE: ActivityFiltersState = {
  type: [],
}

export const DEFAULT_ACTIVITY_FILTERS_OPENED_STATE: ActivityFiltersOpenedState = {
  open: false,
  type: [],
  scrollTop: 0,
}

export const toggleFiltersType = (
  state: ActivityFiltersOpenedState,
  { payload }: PayloadAction<ActivityTypeFilterType>
) => {
  const index = state.type.findIndex((type) => type === payload)
  if (index > -1) {
    state.type.splice(index, 1)
  } else {
    state.type.push(payload)
  }
}

export const setFiltersType = (
  state: ActivityFiltersOpenedState,
  { payload }: PayloadAction<ActivityTypeFilterType>
) => {
  state.type = [payload]
}

export const setFiltersOpen = (state: ActivityFiltersOpenedState, { payload }: PayloadAction<boolean>) => {
  state.open = payload
}

export const setFiltersScrollTop = (state: ActivityFiltersOpenedState, { payload }: PayloadAction<number>) => {
  state.scrollTop = payload
}

export const clearFilters = (state: ActivityFiltersOpenedState) => {
  state.type = []
}

export const ACTIVITY_FILTERS_ACTIONS = {
  toggleFiltersType,
  setFiltersType,
  setFiltersOpen,
  setFiltersScrollTop,
  clearFilters,
}
