'use client'

import React, { useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import VirtualList from '@/components/ui/virtuallist'
import { fetchNotifications } from '@/api/notifications/fetchNotifications'
import NotificationRow from './notificationRow'
import { Cross } from 'ethereum-identity-kit'
import NotificationLoadingRow from './loadingRow'
import NoResults from '@/components/ui/noResults'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const virtualListRef = useRef<HTMLDivElement>(null)

  // Fetch notifications with infinite query
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
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
  })

  // Get all notifications from pages
  const allNotifications = data?.pages.flatMap(page => page.notifications) || []
  const isNotificationsLoading = isLoading || isFetchingNextPage

  if (!isOpen) return null

  return (
    <div
      className="fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center bg-black/50 px-2 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background border-primary relative flex h-[600px] w-full max-w-xl flex-col rounded-md border-2 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-2xl font-sedan-sc text-foreground">Notifications</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-primary/10 rounded-md transition-colors"
          >
            <Cross className="w-4 h-4 text-foreground cursor-pointer" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="flex-1 overflow-hidden">
          {allNotifications.length > 0 ? <VirtualList
            ref={virtualListRef}
            items={isNotificationsLoading ? [...allNotifications, ...Array(6).fill(null)] : [...allNotifications]}
            visibleCount={20}
            rowHeight={60}
            overscanCount={10}
            paddingBottom='0'
            renderItem={(notification) => {
              if (!notification) return <NotificationLoadingRow />

              return (
                <NotificationRow
                  notification={notification}
                  onClick={() => onClose()}
                />
              )
            }}
            onScrollNearBottom={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
              }
            }}
            containerClassName="h-full"
          /> : <NoResults label="No notifications" />}
        </div>
      </div>
    </div>
  )
}

export default NotificationModal