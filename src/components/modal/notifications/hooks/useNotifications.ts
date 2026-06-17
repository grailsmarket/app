import { fetchNotifications } from '@/api/notifications/fetchNotifications'
import { markAllAsRead } from '@/api/notifications/markAllAsRead'
import { useUserContext } from '@/context/user'
import type { NotificationType } from '@/types/notifications'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

interface UseNotificationsProps {
  isOpen: boolean
}

// Types that render without an ENS name (their own row components), so the
// ensName/ensTokenId requirement below must not drop them.
const NON_ENS_NOTIFICATION_TYPES = new Set<NotificationType>(['admin-broadcast', 'chat_reply', 'chat_mention'])

export const useNotifications = ({ isOpen }: UseNotificationsProps) => {
  const queryClient = useQueryClient()
  const { userAddress } = useUserContext()

  // Fetch notifications with infinite query
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      return await fetchNotifications({ page: pageParam, limit: 20 })
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
    },
    enabled: isOpen,
    initialPageParam: 1,
    retry: 1,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  })

  // Get all notifications from pages. Admin broadcasts + chat (reply/mention)
  // notifications render without an ENS name; ENS-scoped notifications still
  // require both name + tokenId (malformed rows are dropped).
  const allNotifications =
    data?.pages
      .flatMap((page) => page.notifications)
      .filter(
        (notification) =>
          NON_ENS_NOTIFICATION_TYPES.has(notification.type) ||
          (!!notification.ensName && !!notification.ensTokenId)
      ) || []
  const isNotificationsLoading = isLoading || isFetchingNextPage

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.setQueryData(['unreadCount', userAddress], 0)
    },
  })

  // call mutation on open
  useEffect(() => {
    markAllAsReadMutation.mutate()
  }, [isOpen])

  return {
    notifications: allNotifications,
    isNotificationsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    markAllAsReadMutation,
  }
}
