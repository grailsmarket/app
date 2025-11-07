import { MOCK_NOTIFICATIONS_RESPONSE } from '@/constants/mock/notifications'
import { NotificationsResponse } from '@/types/notifications'

interface FetchNotificationsParams {
  page?: number
  limit?: number
  unreadOnly?: boolean
}

export const fetchNotificationsMock = async ({
  page = 1,
  limit = 20,
  unreadOnly = false,
}: FetchNotificationsParams = {}): Promise<NotificationsResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Filter notifications based on parameters
  let notifications = [...MOCK_NOTIFICATIONS_RESPONSE.notifications]

  if (unreadOnly) {
    notifications = notifications.filter((n) => !n.isRead)
  }

  // Paginate results
  const start = (page - 1) * limit
  const end = start + limit
  const paginatedNotifications = notifications.slice(start, end)

  return {
    notifications: paginatedNotifications,
    pagination: {
      page,
      limit,
      total: notifications.length,
      totalPages: Math.ceil(notifications.length / limit),
      hasNext: end < notifications.length,
      hasPrev: page > 1,
    },
  }
}
