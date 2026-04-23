import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'

export const deleteDashboardLayout = async (id: number): Promise<void> => {
  const response = await authFetch(`${API_URL}/dashboard-layouts/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  })

  const data = (await response.json()) as APIResponseType<{ message: string }>

  if (!data.success) {
    console.error(data.error?.message || 'Failed to delete dashboard layout')
  }
}
