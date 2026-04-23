'use client'

import React, { useCallback, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchNotifications } from '@/api/notifications/fetchNotifications'
import NotificationRow from './notificationRow'
import { Cross } from 'ethereum-identity-kit'
import NotificationLoadingRow from './loadingRow'
import NoResults from '@/components/ui/noResults'
import { cn } from '@/utils/tailwind'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationModal: React.FC<NotificationModalProps> = ({ isOpen, onClose }) => {
  // const [expandedImage, setExpandedImage] = useState<string | null>(null)
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
      // onClick={onClose}
    >
      {/* <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 h-full w-full bg-black/40'
            onClick={(e) => {
              e.stopPropagation()
              setExpandedImage(null)
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {expandedImage ? (
          <div className='fixed inset-0 mx-auto h-fit top-1/2 -translate-y-1/2 w-fit z-100 flex items-center justify-center' onClick={(e) => e.stopPropagation()}>
            <div className='relative max-w-5xl w-[calc(100dvw-40px)] group'>
              <motion.button
                initial={{ display: 'none' }}
                animate={{ display: 'flex', transition: { delay: 0.4 } }}
                exit={{ display: 'none', transition: { duration: 0.001 } }}
                className='absolute top-2 right-2 flex h-8 w-8 z-20 items-center p-md justify-center cursor-pointer rounded-md starting:opacity-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50 hover:bg-black/70'
                onClick={() => setExpandedImage(null)}
              >
                <Cross className='h-auto w-6' />
              </motion.button>
              <motion.div layoutId={`image-${expandedImage}`}>
                <Image width={2000} height={2000} src={expandedImage} alt='Expanded Image' className='h-auto w-full' />
              </motion.div>
            </div>
          </div>
        ) : null}</AnimatePresence> */}
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
                <div
                  key={notification.id || index}
                  className={cn('border-secondary border-t border-b', notification.isRead ? '' : 'bg-primary/10')}
                >
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
