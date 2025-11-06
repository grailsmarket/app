import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarkAsReadResponse } from '@/types/notifications'
import { authFetch } from '../authFetch'

export const markAsRead = async (notificationId: number): Promise<MarkAsReadResponse> => {
  const response = await authFetch(`${API_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Failed to mark notification as read')
  }

  const data = (await response.json()) as APIResponseType<MarkAsReadResponse>
  return data.data
}
