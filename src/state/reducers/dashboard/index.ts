import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { LayoutItem } from 'react-grid-layout'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import type { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import {
  type DashboardState,
  type DashboardLayouts,
  type DashboardBreakpoint,
  type DashboardComponentType,
  type DashboardComponentConfig,
  DEFAULT_WIDGET_SIZES,
  DASHBOARD_COLS,
} from './types'

// ── Default configs per component type ──────────────────────────
const createDefaultConfig = (type: DashboardComponentType): DashboardComponentConfig => {
  switch (type) {
    case 'domains':
      return { type, viewType: 'grid', filters: { ...emptyFilterState }, filtersOpen: false }
    case 'top-sales':
    case 'top-offers':
    case 'top-registrations':
      return { type, period: '7d', source: 'all', category: null }
    case 'sales-chart':
    case 'offers-chart':
    case 'registrations-chart':
      return { type, period: '7d', category: null }
    case 'holders':
      return { type, categories: [] }
    case 'leaderboard':
      return { type, sortBy: 'names_owned', sortOrder: 'desc', clubs: [] }
    case 'activity':
      return { type, eventTypes: [], category: null }
  }
}

// ── Initial state ───────────────────────────────────────────────
const initialState: DashboardState = {
  layouts: { lg: [], md: [], sm: [], xs: [] },
  components: {},
  sidebarOpen: false,
  nextId: 1,
  colOverride: null,
}

// ── Helper: find next available position in a layout ────────────
const findNextPosition = (layout: LayoutItem[], cols: number, itemW: number): { x: number; y: number } => {
  if (layout.length === 0) return { x: 0, y: 0 }

  // Build an occupancy map: for each row y, track which x columns are occupied
  let maxBottom = 0
  for (const item of layout) {
    const bottom = item.y + item.h
    if (bottom > maxBottom) maxBottom = bottom
  }

  // Scan from top to bottom for the first position that fits
  // This naturally fills gaps and places next to existing widgets
  for (let y = 0; y <= maxBottom; y++) {
    for (let x = 0; x <= cols - itemW; x++) {
      // Check if this position (x, y, itemW, 1 row) collides with any existing item
      const fits = !layout.some(
        (item) => x < item.x + item.w && x + itemW > item.x && y < item.y + item.h && y + 1 > item.y
      )
      if (fits) return { x, y }
    }
  }

  // No gap found — place on a new row below everything
  return { x: 0, y: maxBottom }
}

// ── Slice ───────────────────────────────────────────────────────
export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    addComponent(
      state,
      action: PayloadAction<{
        type: DashboardComponentType
        position?: { x: number; y: number }
      }>
    ) {
      const { type, position } = action.payload
      const id = `widget-${state.nextId}`
      state.nextId++

      // Create default config
      state.components[id] = createDefaultConfig(type)

      // Create layout entry for each breakpoint
      const sizes = DEFAULT_WIDGET_SIZES[type]
      const breakpoints: DashboardBreakpoint[] = ['lg', 'md', 'sm', 'xs']

      for (const bp of breakpoints) {
        const cols = DASHBOARD_COLS[bp]
        const w = Math.min(sizes.w, cols)
        const pos = position && bp === 'lg' ? position : findNextPosition(state.layouts[bp], cols, w)

        state.layouts[bp].push({
          i: id,
          x: Math.min(pos.x, cols - w),
          y: pos.y,
          w,
          h: sizes.h,
          minW: sizes.minW,
          minH: sizes.minH,
        })
      }
    },

    removeComponent(state, action: PayloadAction<string>) {
      const id = action.payload
      delete state.components[id]

      const breakpoints: DashboardBreakpoint[] = ['lg', 'md', 'sm', 'xs']
      for (const bp of breakpoints) {
        state.layouts[bp] = state.layouts[bp].filter((item) => item.i !== id)
      }
    },

    updateLayouts(state, action: PayloadAction<DashboardLayouts>) {
      state.layouts = action.payload
    },

    updateComponentConfig(state, action: PayloadAction<{ id: string; patch: Partial<DashboardComponentConfig> }>) {
      const { id, patch } = action.payload
      const existing = state.components[id]
      if (!existing) return
      state.components[id] = { ...existing, ...patch } as DashboardComponentConfig
    },

    // Specific action for domain filter updates to allow deep merging
    updateDomainFilters(state, action: PayloadAction<{ id: string; filters: Partial<MarketplaceFiltersState> }>) {
      const { id, filters } = action.payload
      const existing = state.components[id]
      if (!existing || existing.type !== 'domains') return
      existing.filters = { ...existing.filters, ...filters }
    },

    setDomainFiltersOpen(state, action: PayloadAction<{ id: string; open: boolean }>) {
      const { id, open } = action.payload
      const existing = state.components[id]
      if (!existing || existing.type !== 'domains') return
      existing.filtersOpen = open
    },

    clearDomainFilters(state, action: PayloadAction<string>) {
      const existing = state.components[action.payload]
      if (!existing || existing.type !== 'domains') return
      existing.filters = { ...emptyFilterState }
    },

    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload
    },

    setColOverride(state, action: PayloadAction<number | null>) {
      state.colOverride = action.payload
    },

    hydrateFromServer(
      state,
      action: PayloadAction<{
        layouts: DashboardLayouts
        components: Record<string, DashboardComponentConfig>
        nextId: number
        colOverride: number | null
      }>
    ) {
      const { layouts, components, nextId, colOverride } = action.payload
      state.layouts = layouts
      state.components = components
      state.nextId = nextId
      state.colOverride = colOverride
    },

    resetDashboard() {
      return initialState
    },
  },
})

export const {
  addComponent,
  removeComponent,
  updateLayouts,
  updateComponentConfig,
  updateDomainFilters,
  setDomainFiltersOpen,
  clearDomainFilters,
  setSidebarOpen,
  setColOverride,
  hydrateFromServer,
  resetDashboard,
} = dashboardSlice.actions

export default dashboardSlice.reducer
