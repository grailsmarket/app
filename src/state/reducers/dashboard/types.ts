import type { LayoutItem } from 'react-grid-layout'
import type { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'
import type { LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import { NameFilters } from '@/types/filters/name'

// ── Component types ─────────────────────────────────────────────
export type DashboardComponentType =
  | 'domains'
  | 'top-sales'
  | 'top-offers'
  | 'top-registrations'
  | 'sales-chart'
  | 'offers-chart'
  | 'registrations-chart'
  | 'holders'
  | 'leaderboard'
  | 'activity'

// ── Per-instance configs ────────────────────────────────────────
export type DomainsInstanceConfig = {
  type: 'domains'
  name: string
  viewType: 'grid' | 'list'
  filters: NameFilters
  filtersOpen: boolean
}

export type AnalyticsListInstanceConfig = {
  type: 'top-sales' | 'top-offers' | 'top-registrations'
  name: string
  period: AnalyticsPeriod
  source: AnalyticsSource
  category: string | null
}

export type AnalyticsChartInstanceConfig = {
  type: 'sales-chart' | 'offers-chart' | 'registrations-chart'
  name: string
  period: AnalyticsPeriod
  category: string | null
}

export type HoldersInstanceConfig = {
  type: 'holders'
  name: string
  categories: string[] // empty = "all"
}

export type LeaderboardInstanceConfig = {
  type: 'leaderboard'
  name: string
  sortBy: LeaderboardSortBy
  sortOrder: LeaderboardSortOrder
  clubs: string[]
}

export type ActivityInstanceConfig = {
  type: 'activity'
  name: string
  eventTypes: string[]
  category: string | null // null = all categories
}

export type DashboardComponentConfig =
  | DomainsInstanceConfig
  | AnalyticsListInstanceConfig
  | AnalyticsChartInstanceConfig
  | HoldersInstanceConfig
  | LeaderboardInstanceConfig
  | ActivityInstanceConfig

// ── Layout types ────────────────────────────────────────────────
export type DashboardBreakpoint = 'lg' | 'md' | 'sm' | 'xs'

export type DashboardLayouts = Record<DashboardBreakpoint, LayoutItem[]>

// ── State ───────────────────────────────────────────────────────
export type DashboardState = {
  layoutId: number | null
  name: string
  layouts: DashboardLayouts
  components: Record<string, DashboardComponentConfig>
  sidebarOpen: boolean
  nextId: number
  colOverride: number | null // null = auto (responsive breakpoints)
  isDefault: boolean
}

// ── Grid constants ──────────────────────────────────────────────
export const DASHBOARD_BREAKPOINTS: Record<DashboardBreakpoint, number> = {
  lg: 1750,
  md: 1280,
  sm: 768,
  xs: 0,
}

export const DASHBOARD_COLS: Record<DashboardBreakpoint, number> = {
  lg: 4,
  md: 3,
  sm: 2,
  xs: 1,
}

export const DASHBOARD_ROW_HEIGHT = 120

// Maximum columns allowed at each breakpoint (viewport constraint)
export const MAX_COLS_FOR_WIDTH: { minWidth: number; maxCols: number }[] = [
  { minWidth: 1750, maxCols: 4 },
  { minWidth: 1280, maxCols: 3 },
  { minWidth: 768, maxCols: 2 },
  { minWidth: 0, maxCols: 1 },
]

// Default sizes per widget type: { w, h, minW, minH }
export const DEFAULT_WIDGET_SIZES: Record<
  DashboardComponentType,
  { w: number; h: number; minW: number; minH: number }
> = {
  domains: { w: 2, h: 5, minW: 1, minH: 4 },
  'top-sales': { w: 1, h: 3, minW: 1, minH: 2 },
  'top-offers': { w: 1, h: 3, minW: 1, minH: 2 },
  'top-registrations': { w: 1, h: 3, minW: 1, minH: 2 },
  'sales-chart': { w: 2, h: 3, minW: 1, minH: 2 },
  'offers-chart': { w: 2, h: 3, minW: 1, minH: 2 },
  'registrations-chart': { w: 2, h: 3, minW: 1, minH: 2 },
  holders: { w: 1, h: 4, minW: 1, minH: 2 },
  leaderboard: { w: 1, h: 4, minW: 1, minH: 2 },
  activity: { w: 1, h: 3, minW: 1, minH: 2 },
}

// Human-readable labels
export const WIDGET_LABELS: Record<DashboardComponentType, string> = {
  domains: 'Domains',
  'top-sales': 'Top Sales',
  'top-offers': 'Top Offers',
  'top-registrations': 'Top Registrations',
  'sales-chart': 'Sales Chart',
  'offers-chart': 'Offers Chart',
  'registrations-chart': 'Registrations Chart',
  holders: 'Holders',
  leaderboard: 'Leaderboard',
  activity: 'Activity',
}
