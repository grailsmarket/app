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
    addCategory: (state, action: PayloadAction<string>) => {
      state.categories.push(action.payload)
    },
    removeCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter((category) => category !== action.payload)
    },
  },
})

export const { setPeriod, setSource, setCategories, addCategory, removeCategory } = analyticsSlice.actions

export const selectAnalytics = (state: RootState) => state.analytics

export default analyticsSlice.reducer
