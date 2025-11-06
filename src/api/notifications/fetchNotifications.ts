import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { NotificationsResponse } from '@/types/notifications'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { fetchNotificationsMock } from './fetchNotificationsMock'

interface FetchNotificationsParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export const fetchNotifications = async ({
  page = 1,
  limit = DEFAULT_FETCH_LIMIT,
  unreadOnly = false,
}: FetchNotificationsParams = {}): Promise<NotificationsResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
    })

    const response = await authFetch(`${API_URL}/notifications?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch notifications')
    }

    const data = (await response.json()) as APIResponseType<NotificationsResponse>
    return data.data
  } catch (error) {
    console.warn('Failed to fetch notifications from API, using mock data:', error)
    // Use mock data as fallback
    return fetchNotificationsMock({ page, limit, unreadOnly })
  }
}
