import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { UnreadCountResponse } from '@/types/notifications'
import { authFetch } from '../authFetch'

export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await authFetch(`${API_URL}/notifications/unread/count`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch unread count')
    }

    const data = (await response.json()) as APIResponseType<UnreadCountResponse>
    return data.data.unreadCount
  } catch (error) {
    console.warn('Failed to fetch unread count from API')
    return 0
  }
}
