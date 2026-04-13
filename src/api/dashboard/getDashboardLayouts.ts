import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { DashboardLayoutResponse } from './types'
import { DASHBOARD_LAYOUT_PRESETS } from '@/app/dashboard/mocks/dashboardLayoutPresets'

export const getDashboardLayouts = async (): Promise<DashboardLayoutResponse[]> => {
  const response = await authFetch(`${API_URL}/dashboard-layouts`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  const data = (await response.json()) as APIResponseType<{ layouts: DashboardLayoutResponse[] }>

  if (!data.success) {
    console.error(data.error?.message || 'Failed to fetch dashboard layouts')
    return []
  }

  return data.data.layouts
}
