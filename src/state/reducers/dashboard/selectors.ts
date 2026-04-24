import type { RootState } from '@/state'
import type {
  DashboardComponentConfig,
  DomainsInstanceConfig,
  AnalyticsListInstanceConfig,
  AnalyticsChartInstanceConfig,
  HoldersInstanceConfig,
  LeaderboardInstanceConfig,
  ActivityInstanceConfig,
  NameViewInstanceConfig,
} from './types'

// ── Root selectors ──────────────────────────────────────────────
export const selectDashboard = (state: RootState) => state.dashboard
export const selectDashboardLayouts = (state: RootState) => state.dashboard.layouts
export const selectDashboardComponents = (state: RootState) => state.dashboard.components
export const selectDashboardSidebarOpen = (state: RootState) => state.dashboard.sidebarOpen
export const selectDashboardColOverride = (state: RootState) => state.dashboard.colOverride

// ── Per-instance selectors ──────────────────────────────────────
export const selectDashboardComponent = (state: RootState, id: string): DashboardComponentConfig | undefined =>
  state.dashboard.components[id]

export const selectDomainsConfig = (state: RootState, id: string): DomainsInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  return config?.type === 'domains' ? config : undefined
}

export const selectAnalyticsListConfig = (state: RootState, id: string): AnalyticsListInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  if (!config) return undefined
  if (config.type === 'top-sales' || config.type === 'top-offers' || config.type === 'top-registrations') {
    return config
  }
  return undefined
}

export const selectAnalyticsChartConfig = (state: RootState, id: string): AnalyticsChartInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  if (!config) return undefined
  if (config.type === 'sales-chart' || config.type === 'offers-chart' || config.type === 'registrations-chart') {
    return config
  }
  return undefined
}

export const selectHoldersConfig = (state: RootState, id: string): HoldersInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  return config?.type === 'holders' ? config : undefined
}

export const selectLeaderboardConfig = (state: RootState, id: string): LeaderboardInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  return config?.type === 'leaderboard' ? config : undefined
}

export const selectActivityConfig = (state: RootState, id: string): ActivityInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  return config?.type === 'activity' ? config : undefined
}

export const selectNameViewConfig = (state: RootState, id: string): NameViewInstanceConfig | undefined => {
  const config = state.dashboard.components[id]
  return config?.type === 'name-view' ? config : undefined
}
