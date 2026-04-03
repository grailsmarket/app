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
  layoutId: null,
  name: 'Default',
  layouts: { lg: [], md: [], sm: [], xs: [] },
  components: {},
  sidebarOpen: false,
  nextId: 1,
  colOverride: null,
  isDefault: false,
}

// ── Collision helpers ────────────────────────────────────────────

/** Check if two rectangles overlap on both axes */
const collides = (a: LayoutItem, b: LayoutItem): boolean =>
  a.i !== b.i && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

/**
 * Make room for `newItem` by shifting colliding items (and everything
 * below them) downward.
 *
 * Algorithm:
 *  1. Find every existing item that directly overlaps with `newItem`.
 *  2. Determine the topmost Y among those collisions — everything from
 *     that Y downward needs to move.
 *  3. Shift every item whose top edge is at or below that Y down by
 *     `newItem.h` rows. This keeps the relative order of all items
 *     intact and guarantees no cascading overlaps.
 *
 * Mutates items in the layout array (safe inside Immer).
 */
const makeRoom = (layout: LayoutItem[], newItem: LayoutItem): void => {
  // Step 1: find items that directly collide with the new item
  const directCollisions = layout.filter((item) => collides(newItem, item))
  if (directCollisions.length === 0) return

  // Step 2: the shift boundary is the topmost edge of any collision
  let shiftFromY = Infinity
  for (const item of directCollisions) {
    if (item.y < shiftFromY) shiftFromY = item.y
  }

  // Step 3: push everything at or below that boundary down
  const shiftAmount = newItem.y + newItem.h - shiftFromY
  if (shiftAmount <= 0) return

  for (const item of layout) {
    if (item.y >= shiftFromY) {
      item.y += shiftAmount
    }
  }
}

/** Find the first gap (top-left to bottom-right) where an item fits */
const findNextPosition = (layout: LayoutItem[], cols: number, itemW: number): { x: number; y: number } => {
  if (layout.length === 0) return { x: 0, y: 0 }

  let maxBottom = 0
  for (const item of layout) {
    const bottom = item.y + item.h
    if (bottom > maxBottom) maxBottom = bottom
  }

  // Probe with the item's full height = 1 row to find the first open slot
  for (let y = 0; y <= maxBottom; y++) {
    for (let x = 0; x <= cols - itemW; x++) {
      const fits = !layout.some(
        (item) => x < item.x + item.w && x + itemW > item.x && y < item.y + item.h && y + 1 > item.y
      )
      if (fits) return { x, y }
    }
  }

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
        const pos =
          position && bp === 'lg'
            ? { x: Math.min(position.x, cols - w), y: position.y }
            : findNextPosition(state.layouts[bp], cols, w)

        const newItem: LayoutItem = {
          i: id,
          x: pos.x,
          y: pos.y,
          w,
          h: sizes.h,
          minW: sizes.minW,
          minH: sizes.minH,
        }

        // Shift colliding items and everything below them down
        makeRoom(state.layouts[bp], newItem)

        state.layouts[bp].push(newItem)
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

    setDashboardLayoutId(state, action: PayloadAction<number | null>) {
      state.layoutId = action.payload
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
  removeComponent,
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
