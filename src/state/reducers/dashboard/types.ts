import type { LayoutItem } from 'react-grid-layout'
import type { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'
import type { LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import { NameFilters } from '@/types/filters/name'

// ── Component types ─────────────────────────────────────────────
export type DashboardComponentType =
  | 'domains'
  | 'ai-search'
  | 'top-sales'
  | 'top-offers'
  | 'top-registrations'
  | 'sales-chart'
  | 'offers-chart'
  | 'registrations-chart'
  | 'holders'
  | 'leaderboard'
  | 'activity'
  | 'name-view'
  | 'profile-view'
  | 'watchlist'
  | 'category-holders'
  | 'category-stats'
  | 'portfolio-summary'
  | 'expiring-domains'
  | 'recent-sales'
  | 'recent-premium'
  | 'recent-registrations'
  | 'twitter-feed'

// ── Per-instance configs ────────────────────────────────────────
// `domains` and `ai-search` share an instance shape — they differ only in
// their default `filters.aiSearch` value, which routes the search request
// to the AI semantic endpoint.
export type DomainsInstanceConfig = {
  type: 'domains' | 'ai-search'
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

export type NameViewInstanceConfig = {
  type: 'name-view'
  name: string
  // Current input text in the search bar (preserved across reloads)
  query: string
  // Submitted name being displayed (null = empty widget)
  submittedName: string | null
}

export type ProfileViewInstanceConfig = {
  type: 'profile-view'
  name: string
  // Current input text (ENS name or 0x address)
  query: string
  // Submitted user (ENS name or 0x address, null = empty widget)
  submittedUser: string | null
}

export type WatchlistInstanceConfig = {
  type: 'watchlist'
  name: string
  viewType: 'grid' | 'list'
}

export type CategoryHoldersInstanceConfig = {
  type: 'category-holders'
  name: string
  // Single category (null = prompt user to pick)
  category: string | null
}

export type CategoryStatsInstanceConfig = {
  type: 'category-stats'
  name: string
  category: string | null
}

export type PortfolioSummaryInstanceConfig = {
  type: 'portfolio-summary'
  name: string
}

export type ExpiringDomainsInstanceConfig = {
  type: 'expiring-domains'
  name: string
}

export type RecentInstanceConfig = {
  type: 'recent-sales' | 'recent-premium' | 'recent-registrations'
  name: string
}

export type TwitterFeedInstanceConfig = {
  type: 'twitter-feed'
  name: string
  // Twitter/X handle (no @ prefix). Defaults to ENSMarketBot.
  handle: string
}

export type DashboardComponentConfig =
  | DomainsInstanceConfig
  | AnalyticsListInstanceConfig
  | AnalyticsChartInstanceConfig
  | HoldersInstanceConfig
  | LeaderboardInstanceConfig
  | ActivityInstanceConfig
  | NameViewInstanceConfig
  | ProfileViewInstanceConfig
  | WatchlistInstanceConfig
  | CategoryHoldersInstanceConfig
  | CategoryStatsInstanceConfig
  | PortfolioSummaryInstanceConfig
  | ExpiringDomainsInstanceConfig
  | RecentInstanceConfig
  | TwitterFeedInstanceConfig

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
  'ai-search': { w: 2, h: 5, minW: 1, minH: 4 },
  'top-sales': { w: 1, h: 3, minW: 1, minH: 2 },
  'top-offers': { w: 1, h: 3, minW: 1, minH: 2 },
  'top-registrations': { w: 1, h: 3, minW: 1, minH: 2 },
  'sales-chart': { w: 2, h: 3, minW: 1, minH: 2 },
  'offers-chart': { w: 2, h: 3, minW: 1, minH: 2 },
  'registrations-chart': { w: 2, h: 3, minW: 1, minH: 2 },
  holders: { w: 1, h: 4, minW: 1, minH: 2 },
  leaderboard: { w: 1, h: 4, minW: 1, minH: 2 },
  activity: { w: 1, h: 3, minW: 1, minH: 2 },
  'name-view': { w: 2, h: 6, minW: 1, minH: 3 },
  'profile-view': { w: 2, h: 6, minW: 1, minH: 3 },
  watchlist: { w: 2, h: 5, minW: 1, minH: 3 },
  'category-holders': { w: 2, h: 5, minW: 1, minH: 3 },
  'category-stats': { w: 1, h: 3, minW: 1, minH: 2 },
  'portfolio-summary': { w: 1, h: 3, minW: 1, minH: 2 },
  'expiring-domains': { w: 1, h: 4, minW: 1, minH: 2 },
  'recent-sales': { w: 1, h: 4, minW: 1, minH: 3 },
  'recent-premium': { w: 1, h: 4, minW: 1, minH: 3 },
  'recent-registrations': { w: 1, h: 4, minW: 1, minH: 3 },
  'twitter-feed': { w: 1, h: 6, minW: 1, minH: 3 },
}

// Human-readable labels
export const WIDGET_LABELS: Record<DashboardComponentType, string> = {
  domains: 'Domains',
  'ai-search': 'AI Search',
  'top-sales': 'Top Sales',
  'top-offers': 'Top Offers',
  'top-registrations': 'Top Registrations',
  'sales-chart': 'Sales Chart',
  'offers-chart': 'Offers Chart',
  'registrations-chart': 'Registrations Chart',
  holders: 'Holders',
  leaderboard: 'Leaderboard',
  activity: 'Activity',
  'name-view': 'Name',
  'profile-view': 'Profile',
  watchlist: 'Watchlist',
  'category-holders': 'Category Holders',
  'category-stats': 'Category Stats',
  'portfolio-summary': 'Portfolio Summary',
  'expiring-domains': 'Expiring Names',
  'recent-sales': 'Recent Sales',
  'recent-premium': 'Recent Premium',
  'recent-registrations': 'Recent Registrations',
  'twitter-feed': 'X Feed',
}
