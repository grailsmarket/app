import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarkAllAsReadResponse } from '@/types/notifications'
import { authFetch } from '../authFetch'

export const markAllAsRead = async (): Promise<MarkAllAsReadResponse> => {
  const response = await authFetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read')
  }

  const data = (await response.json()) as APIResponseType<MarkAllAsReadResponse>
  return data.data
}
