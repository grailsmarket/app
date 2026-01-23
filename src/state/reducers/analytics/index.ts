import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/state'
import { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'

interface AnalyticsState {
  period: AnalyticsPeriod
  source: AnalyticsSource
}

const initialState: AnalyticsState = {
  period: '7d',
  source: 'all',
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
  },
})

export const { setPeriod, setSource } = analyticsSlice.actions

export const selectAnalytics = (state: RootState) => state.analytics

export default analyticsSlice.reducer
