import type { DashboardLayouts, DashboardComponentConfig } from '@/state/reducers/dashboard/types'

export type Layout = {
  id: number
  name: string
  colOverride: number | null
  layouts: DashboardLayouts
  components: Record<string, DashboardComponentConfig>
  nextId: number
}

export type DashboardLayoutResponse = {
  id: number
  name: string
  colOverride: number | null
  layouts: DashboardLayouts
  components: Record<string, DashboardComponentConfig>
  nextId: number
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateDashboardLayoutPayload = {
  name: string
  colOverride: number | null
  layouts: DashboardLayouts
  components: Record<string, DashboardComponentConfig>
  nextId: number
  isDefault: boolean
}

export type UpdateDashboardLayoutPayload = Partial<CreateDashboardLayoutPayload>
