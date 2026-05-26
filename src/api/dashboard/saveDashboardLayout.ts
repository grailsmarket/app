import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { DashboardLayoutResponse, CreateDashboardLayoutPayload, UpdateDashboardLayoutPayload } from './types'

export const createDashboardLayout = async (
  payload: CreateDashboardLayoutPayload
): Promise<DashboardLayoutResponse | null> => {
  const response = await authFetch(`${API_URL}/dashboard-layouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as APIResponseType<DashboardLayoutResponse>

  if (!data.success) {
    console.error(data.error?.message || 'Failed to create dashboard layout')
    return null
  }

  return data.data
}

export const updateDashboardLayout = async (
  id: number,
  payload: UpdateDashboardLayoutPayload
): Promise<DashboardLayoutResponse> => {
  const response = await authFetch(`${API_URL}/dashboard-layouts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json()) as APIResponseType<DashboardLayoutResponse>

  if (!data.success) {
    console.error(data.error?.message || 'Failed to update dashboard layout')
  }

  return data.data
}
