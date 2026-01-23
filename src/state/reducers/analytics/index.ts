import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/state'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'

interface AnalyticsState {
  period: AnalyticsPeriod
  source: AnalyticsSource
  category: string | null
}

const initialState: AnalyticsState = {
  period: '7d',
  source: 'all',
  category: null,
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
    setCategory: (state, action: PayloadAction<string | null>) => {
      state.category = action.payload
    },
  },
})

export const { setPeriod, setSource, setCategory } = analyticsSlice.actions

export const selectAnalytics = (state: RootState) => state.analytics

export default analyticsSlice.reducer
