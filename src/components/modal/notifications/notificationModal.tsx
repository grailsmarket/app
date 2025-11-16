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

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  const virtualListRef = useRef<HTMLDivElement>(null)

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
  })

  // Get all notifications from pages
  const allNotifications = data?.pages.flatMap((page) => page.notifications) || []
  const isNotificationsLoading = isLoading || isFetchingNextPage

  if (!isOpen) return null

  return (
    <div
      className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-[100dvh] w-screen items-end justify-end bg-black/50 md:px-2 md:py-12 backdrop-blur-sm md:items-center md:justify-center'
      onClick={onClose}
    >
      <div
        className='bg-background border-secondary relative flex md:h-[600px] w-full md:max-w-xl flex-col rounded-md border-2 max-h-[calc(100dvh-80px)]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='p-lg flex items-center justify-between pt-6 md:p-6'>
          <h2 className='font-sedan-sc text-foreground text-2xl'>Notifications</h2>
          <button onClick={onClose} className='hover:bg-primary/10 rounded-md p-1 transition-colors'>
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button>
        </div>

        {/* Notifications list */}
        <div className='flex-1 overflow-hidden'>
          <VirtualList
            listHeight='auto'
            ref={virtualListRef}
            items={isNotificationsLoading ? [...allNotifications, ...Array(6).fill(null)] : [...allNotifications]}
            visibleCount={20}
            rowHeight={60}
            overscanCount={10}
            paddingBottom='0'
            useLocalScrollTop={true}
            renderItem={(notification) => {
              if (!notification) return <NotificationLoadingRow />

              return <NotificationRow notification={notification} onClick={() => onClose()} />
            }}
            onScrollNearBottom={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage()
              }
            }}
            containerClassName='h-full'
          />
          {allNotifications.length === 0 && !isNotificationsLoading && (
            <NoResults label='No notifications' height='50vh' />
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
