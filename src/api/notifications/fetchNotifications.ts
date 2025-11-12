import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { NotificationsResponse } from '@/types/notifications'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'

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
    console.error('Failed to fetch notifications from API, using mock data:', error)
    return {
      notifications: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    }
  }
}
