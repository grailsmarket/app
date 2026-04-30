import { fetchNotifications } from '@/api/notifications/fetchNotifications'
import { markAllAsRead } from '@/api/notifications/markAllAsRead'
import { useUserContext } from '@/context/user'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

interface UseNotificationsProps {
  isOpen: boolean
}

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

  // Get all notifications from pages. Admin broadcasts have no ensName/ensTokenId;
  // ENS-scoped notifications still require both (malformed rows are dropped).
  const allNotifications =
    data?.pages
      .flatMap((page) => page.notifications)
      .filter(
        (notification) =>
          notification.type === 'admin-broadcast' || (!!notification.ensName && !!notification.ensTokenId)
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
