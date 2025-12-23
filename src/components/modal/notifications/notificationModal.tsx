'use client'

import React, { useCallback, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)

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
  const allNotifications =
    data?.pages
      .flatMap((page) => page.notifications)
      .filter((notification) => !!notification.ensName && !!notification.ensTokenId) || []
  const isNotificationsLoading = isLoading || isFetchingNextPage

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    if (scrollHeight - scrollTop - clientHeight < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (!isOpen) return null

  return (
    <div
      className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-[100dvh] w-screen items-end justify-end bg-black/50 backdrop-blur-sm md:items-center md:justify-center md:px-2 md:py-12'
      onClick={onClose}
    >
      <div
        className='bg-background border-secondary relative flex max-h-[calc(100dvh-80px)] w-full flex-col border-t-2 md:h-[600px] md:max-h-[600px] md:max-w-xl md:rounded-md md:border-2'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='p-lg flex items-center justify-between md:p-6'>
          <h2 className='font-sedan-sc text-foreground text-2xl'>Notifications</h2>
          <button onClick={onClose} className='hover:bg-primary/10 rounded-md p-1 transition-colors'>
            <Cross className='text-foreground h-4 w-4 cursor-pointer' />
          </button>
        </div>

        {/* Notifications list */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className='flex-1 overflow-y-auto'>
          {allNotifications.length === 0 && !isNotificationsLoading ? (
            <NoResults label='No notifications' height='400px' />
          ) : (
            <div className='flex flex-col'>
              {allNotifications.map((notification, index) => (
                <div key={notification.id || index} className='h-16'>
                  <NotificationRow notification={notification} onClick={() => onClose()} index={index} />
                </div>
              ))}
              {isNotificationsLoading &&
                Array(10)
                  .fill(null)
                  .map((_, index) => (
                    <div key={`loading-${index}`} className='h-16'>
                      <NotificationLoadingRow />
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
