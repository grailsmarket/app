import { createSlice } from '@reduxjs/toolkit'
import type { RootState } from '../../index'
import {
  DEFAULT_FEED_FILTERS_OPENED_STATE,
  DEFAULT_FEED_FILTERS_STATE,
  FEED_FILTERS_ACTIONS,
} from '@/constants/filters/feed'
import type { FeedFiltersOpenedState, FeedFiltersState } from '@/types/filters/feed'

export const emptyFilterState: FeedFiltersState = {
  ...DEFAULT_FEED_FILTERS_STATE,
}

export const initialState: FeedFiltersOpenedState = {
  ...DEFAULT_FEED_FILTERS_OPENED_STATE,
}

export const feedFiltersSlice = createSlice({
  name: 'feedFilters',
  initialState,
  reducers: {
    ...FEED_FILTERS_ACTIONS,
  },
})

export const FeedFilterActions = feedFiltersSlice.actions

export const selectFeedFilters = (state: RootState) => state.filters.feedFilters

export default feedFiltersSlice.reducer
