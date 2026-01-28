import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/state'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'

interface AnalyticsState {
  period: AnalyticsPeriod
  source: AnalyticsSource
  categories: string[]
}

const initialState: AnalyticsState = {
  period: '7d',
  source: 'all',
  categories: [],
}

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setPeriod: (state, action: PayloadAction<AnalyticsPeriod>) => {
      state.period = action.payload
    },
    setSource: (state, action: PayloadAction<AnalyticsSource>) => {
      state.source = action.payload
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload
    },
    toggleCategory: (state, action: PayloadAction<string>) => {
      const category = action.payload
      if (state.categories.includes(category)) {
        state.categories = state.categories.filter((c) => c !== category)
      } else {
        state.categories.push(category)
      }
    },
    clearCategories: (state) => {
      state.categories = []
    },
  },
})

export const { setPeriod, setSource, setCategories, toggleCategory, clearCategories } = analyticsSlice.actions

export const selectAnalytics = (state: RootState) => state.analytics

export default analyticsSlice.reducer
