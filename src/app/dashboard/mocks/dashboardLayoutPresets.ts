import type { LayoutItem } from 'react-grid-layout'
import type { DashboardLayoutResponse, Layout } from '@/api/dashboard/types'
import type { DashboardComponentConfig } from '@/state/reducers/dashboard/types'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'

/** Negative IDs distinguish mock presets from API-backed layouts. */
export type DashboardLayoutPreset = Layout & { description?: string }

const G = (i: string, x: number, y: number, w: number, h: number, minW: number, minH: number): LayoutItem => ({
  i,
  x,
  y,
  w,
  h,
  minW,
  minH,
  moved: false,
  static: false,
})

const domainsWidget = (): DashboardComponentConfig => ({
  type: 'domains',
  viewType: 'grid',
  filters: { ...emptyFilterState },
  filtersOpen: false,
})

/**
 * Example presets mirroring persisted dashboard shape (`layouts` per breakpoint + `components`).
 * Use for Storybook, local `loadLayout`, or API seed data.
 */
export const DASHBOARD_LAYOUT_PRESETS: DashboardLayoutResponse[] = [
  {
    id: 1,
    name: 'Overview',
    colOverride: 3,
    nextId: 6,
    isDefault: true,
    layouts: {
      lg: [
        G('widget-1', 0, 0, 1, 5, 1, 2),
        G('widget-2', 1, 0, 2, 5, 1, 4),
        G('widget-4', 3, 0, 1, 3, 1, 2),
        G('widget-5', 0, 5, 2, 3, 1, 2),
      ],
      md: [
        G('widget-1', 0, 0, 1, 5, 1, 2),
        G('widget-2', 1, 0, 2, 5, 1, 4),
        G('widget-4', 0, 3, 1, 3, 1, 2),
        G('widget-5', 1, 5, 2, 3, 1, 2),
      ],
      sm: [
        G('widget-1', 0, 0, 1, 3, 1, 2),
        G('widget-2', 0, 3, 2, 5, 1, 4),
        G('widget-4', 1, 0, 1, 3, 1, 2),
        G('widget-5', 0, 8, 2, 3, 1, 2),
      ],
      xs: [
        { i: 'widget-1', x: 0, y: 0, w: 1, h: 3, minW: 1, minH: 2 },
        { i: 'widget-2', x: 0, y: 3, w: 1, h: 5, minW: 1, minH: 4 },
        { i: 'widget-4', x: 0, y: 8, w: 1, h: 3, minW: 1, minH: 2 },
        { i: 'widget-5', x: 0, y: 11, w: 1, h: 3, minW: 1, minH: 2 },
      ],
    },
    components: {
      'widget-1': { type: 'activity', eventTypes: [], category: null },
      'widget-2': domainsWidget(),
      'widget-4': { type: 'top-offers', period: '7d', source: 'all', category: null },
      'widget-5': { type: 'offers-chart', period: '7d', category: null },
    },
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 2,
    name: 'Analytics strip',
    colOverride: null,
    isDefault: false,
    nextId: 5,
    layouts: {
      lg: [
        G('widget-1', 0, 0, 1, 3, 1, 2),
        G('widget-2', 1, 0, 2, 5, 1, 4),
        G('widget-3', 3, 0, 1, 3, 1, 2),
        G('widget-4', 0, 5, 4, 3, 1, 2),
      ],
      md: [
        G('widget-1', 0, 0, 1, 3, 1, 2),
        G('widget-2', 1, 0, 2, 5, 1, 4),
        G('widget-3', 0, 3, 1, 3, 1, 2),
        G('widget-4', 0, 5, 3, 3, 1, 2),
      ],
      sm: [
        G('widget-1', 0, 0, 1, 3, 1, 2),
        G('widget-2', 0, 3, 2, 5, 1, 4),
        G('widget-3', 1, 0, 1, 3, 1, 2),
        G('widget-4', 0, 8, 2, 3, 1, 2),
      ],
      xs: [
        { i: 'widget-1', x: 0, y: 0, w: 1, h: 3, minW: 1, minH: 2 },
        { i: 'widget-2', x: 0, y: 3, w: 1, h: 5, minW: 1, minH: 4 },
        { i: 'widget-3', x: 0, y: 8, w: 1, h: 3, minW: 1, minH: 2 },
        { i: 'widget-4', x: 0, y: 11, w: 1, h: 3, minW: 1, minH: 2 },
      ],
    },
    components: {
      'widget-1': { type: 'activity', eventTypes: [], category: null },
      'widget-2': domainsWidget(),
      'widget-3': { type: 'top-sales', period: '7d', source: 'all', category: null },
      'widget-4': { type: 'sales-chart', period: '7d', category: null },
    },
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 3,
    name: 'Leaderboard & regs',
    colOverride: null,
    nextId: 5,
    isDefault: false,
    layouts: {
      lg: [
        G('widget-1', 0, 0, 1, 4, 1, 2),
        G('widget-2', 1, 0, 1, 4, 1, 2),
        G('widget-3', 2, 0, 2, 5, 1, 4),
        G('widget-4', 0, 0, 2, 3, 1, 2),
      ],
      md: [
        G('widget-1', 0, 0, 1, 3, 1, 2),
        G('widget-2', 1, 0, 1, 3, 1, 2),
        G('widget-3', 0, 4, 3, 7, 1, 4),
        G('widget-4', 2, 0, 1, 3, 1, 2),
      ],
      sm: [
        G('widget-1', 0, 0, 1, 4, 1, 2),
        G('widget-2', 1, 0, 1, 4, 1, 2),
        G('widget-3', 0, 4, 2, 5, 1, 4),
        G('widget-4', 0, 9, 2, 3, 1, 2),
      ],
      xs: [
        { i: 'widget-1', x: 0, y: 0, w: 1, h: 4, minW: 1, minH: 2 },
        { i: 'widget-2', x: 0, y: 4, w: 1, h: 4, minW: 1, minH: 2 },
        { i: 'widget-3', x: 0, y: 8, w: 1, h: 5, minW: 1, minH: 4 },
        { i: 'widget-4', x: 0, y: 13, w: 1, h: 3, minW: 1, minH: 2 },
      ],
    },
    components: {
      'widget-1': { type: 'leaderboard', sortBy: 'names_owned', sortOrder: 'desc', clubs: [] },
      'widget-2': { type: 'holders', categories: [] },
      'widget-3': domainsWidget(),
      'widget-4': { type: 'registrations-chart', period: '7d', category: null },
    },
    createdAt: '',
    updatedAt: '',
  },
]

/** Look up a preset by mock id (negative) or name. */
export function getDashboardLayoutPreset(idOrName: number | string): DashboardLayoutPreset | undefined {
  return DASHBOARD_LAYOUT_PRESETS.find((p) => p.id === idOrName || p.name === idOrName)
}
