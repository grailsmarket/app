import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { LayoutItem } from 'react-grid-layout'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import {
  type DashboardState,
  type DashboardLayouts,
  type DashboardBreakpoint,
  type DashboardComponentType,
  type DashboardComponentConfig,
  DEFAULT_WIDGET_SIZES,
  DASHBOARD_COLS,
  WIDGET_LABELS,
} from './types'
import { NameFilters } from '@/types/filters/name'

// ── Default configs per component type ──────────────────────────
const createDefaultConfig = (type: DashboardComponentType): DashboardComponentConfig => {
  const name = WIDGET_LABELS[type]

  switch (type) {
    case 'domains':
      return { type, name, viewType: 'grid', filters: { ...emptyFilterState }, filtersOpen: false }
    case 'top-sales':
    case 'top-offers':
    case 'top-registrations':
      return { type, name, period: '7d', source: 'all', category: null }
    case 'sales-chart':
    case 'offers-chart':
    case 'registrations-chart':
      return { type, name, period: '7d', category: null }
    case 'holders':
      return { type, name, categories: [] }
    case 'leaderboard':
      return { type, name, sortBy: 'names_owned', sortOrder: 'desc', clubs: [] }
    case 'activity':
      return { type, name, eventTypes: [], category: null }
    case 'name-view':
      return { type, name, query: '', submittedName: null }
    case 'profile-view':
      return { type, name, query: '', submittedUser: null }
  }
}

// ── Initial state ───────────────────────────────────────────────
const initialState: DashboardState = {
  layoutId: null,
  name: 'Default',
  layouts: { lg: [], md: [], sm: [], xs: [] },
  components: {},
  sidebarOpen: false,
  nextId: 1,
  colOverride: null,
  isDefault: false,
}

// ── Layout helpers ──────────────────────────────────────────────

/** Get the Y coordinate at the bottom of all existing items. */
const getBottomY = (layout: LayoutItem[]): number => {
  let bottom = 0
  for (const item of layout) {
    const itemBottom = item.y + item.h
    if (itemBottom > bottom) bottom = itemBottom
  }
  return bottom
}

/**
 * Find the first available (x, y) position where a widget of size w×h fits
 * without overlapping existing items. Scans top-to-bottom, left-to-right.
 * Falls back to (0, bottomY) if no gap is found within the existing bounds.
 */
const findFirstAvailablePosition = (
  layout: LayoutItem[],
  cols: number,
  w: number,
  h: number
): { x: number; y: number } => {
  const bottomY = getBottomY(layout)
  if (layout.length === 0) return { x: 0, y: 0 }

  // Build occupancy grid: occupied[y][x] = true if cell is taken
  const rows = bottomY + h
  const occupied: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))

  for (const item of layout) {
    for (let iy = item.y; iy < item.y + item.h && iy < rows; iy++) {
      for (let ix = item.x; ix < item.x + item.w && ix < cols; ix++) {
        occupied[iy][ix] = true
      }
    }
  }

  // Scan for the first position where the w×h rectangle fits entirely
  for (let y = 0; y <= bottomY; y++) {
    for (let x = 0; x <= cols - w; x++) {
      let fits = true
      for (let dy = 0; dy < h && fits; dy++) {
        for (let dx = 0; dx < w && fits; dx++) {
          if (y + dy >= rows || occupied[y + dy][x + dx]) fits = false
        }
      }
      if (fits) return { x, y }
    }
  }

  return { x: 0, y: bottomY }
}

// ── Slice ───────────────────────────────────────────────────────
export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    /** Add a component via click (appends at bottom, no collision issues) */
    addComponent(state, action: PayloadAction<{ type: DashboardComponentType }>) {
      const { type } = action.payload
      const id = `widget-${state.nextId}`
      state.nextId++

      state.components[id] = createDefaultConfig(type)

      const sizes = DEFAULT_WIDGET_SIZES[type]
      const breakpoints: DashboardBreakpoint[] = ['lg', 'md', 'sm', 'xs']

      for (const bp of breakpoints) {
        const cols = DASHBOARD_COLS[bp]
        const w = Math.min(sizes.w, cols)
        const pos = findFirstAvailablePosition(state.layouts[bp], cols, w, sizes.h)

        state.layouts[bp].push({
          i: id,
          ...pos,
          w,
          h: sizes.h,
          minW: sizes.minW,
          minH: sizes.minH,
        })
      }
    },

    /**
     * Add a component via drag-and-drop.
     *
     * RGL's `onDrop` provides the full layout (first callback arg)
     * with all items already repositioned around the drop — collisions
     * are resolved by RGL's compactor. We accept that layout for the
     * active breakpoint as-is, just swapping the placeholder id
     * (`__dropping-elem__`) with the real widget id.
     *
     * For other breakpoints we append at the bottom (same as click-to-add).
     */
    dropComponent(
      state,
      action: PayloadAction<{
        type: DashboardComponentType
        resolvedLayout: LayoutItem[]
        breakpoint: DashboardBreakpoint
      }>
    ) {
      const { type, resolvedLayout, breakpoint } = action.payload
      const id = `widget-${state.nextId}`
      state.nextId++

      state.components[id] = createDefaultConfig(type)

      const sizes = DEFAULT_WIDGET_SIZES[type]
      const allBreakpoints: DashboardBreakpoint[] = ['lg', 'md', 'sm', 'xs']

      for (const bp of allBreakpoints) {
        if (bp === breakpoint) {
          // Use RGL's resolved layout, replacing the placeholder id
          state.layouts[bp] = resolvedLayout.map((item) => ({
            ...item,
            i: item.i === '__dropping-elem__' ? id : item.i,
            // Ensure minW/minH are preserved for existing items
            minW:
              item.i === '__dropping-elem__' ? sizes.minW : (state.layouts[bp].find((l) => l.i === item.i)?.minW ?? 1),
            minH:
              item.i === '__dropping-elem__' ? sizes.minH : (state.layouts[bp].find((l) => l.i === item.i)?.minH ?? 1),
          }))
        } else {
          const cols = DASHBOARD_COLS[bp]
          const w = Math.min(sizes.w, cols)
          state.layouts[bp].push({
            i: id,
            x: 0,
            y: getBottomY(state.layouts[bp]),
            w,
            h: sizes.h,
            minW: sizes.minW,
            minH: sizes.minH,
          })
        }
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

    renameComponent(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload
      const existing = state.components[id]
      if (existing) existing.name = name
    },

    updateComponentConfig(state, action: PayloadAction<{ id: string; patch: Partial<DashboardComponentConfig> }>) {
      const { id, patch } = action.payload
      const existing = state.components[id]
      if (!existing) return
      state.components[id] = { ...existing, ...patch } as DashboardComponentConfig
    },

    setDashboardLayoutId(state, action: PayloadAction<number | null>) {
      state.layoutId = action.payload
    },

    // Specific action for domain filter updates to allow deep merging
    updateDomainFilters(state, action: PayloadAction<{ id: string; filters: Partial<NameFilters> }>) {
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
        layoutId: number | null
        name: string
        layouts: DashboardLayouts
        components: Record<string, DashboardComponentConfig>
        nextId: number
        colOverride: number | null
      }>
    ) {
      const { layouts, components, nextId, colOverride, layoutId, name } = action.payload
      state.layoutId = layoutId
      state.name = name
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
  dropComponent,
  removeComponent,
  renameComponent,
  updateLayouts,
  updateComponentConfig,
  setDashboardLayoutId,
  updateDomainFilters,
  setDomainFiltersOpen,
  clearDomainFilters,
  setSidebarOpen,
  setColOverride,
  hydrateFromServer,
  resetDashboard,
} = dashboardSlice.actions

export default dashboardSlice.reducer
