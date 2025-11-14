'use client'

import React from 'react'
import Image from 'next/image'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAppDispatch } from '@/state/hooks'
import { setNotificationModalOpen } from '@/state/reducers/modals/notificationModal'
import { getUnreadCount } from '@/api/notifications/getUnreadCount'
import notifications from 'public/icons/bell.svg'
import { cn } from '@/utils/tailwind'
import { markAllAsRead } from '@/api/notifications/markAllAsRead'
import { useUserContext } from '@/context/user'

const Notifications = () => {
  const { userAddress, authStatus } = useUserContext()
  const dispatch = useAppDispatch()

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['unreadCount', userAddress],
    queryFn: getUnreadCount,
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once on failure
    enabled: !!userAddress && authStatus === 'authenticated', // Always try to fetch
  })

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      refetchUnreadCount()
    },
  })

  const handleClick = () => {
    markAllAsReadMutation.mutate()
    dispatch(setNotificationModalOpen(true))
  }

  return (
    <button onClick={handleClick} className='hover:bg-primary/10 relative rounded-md p-1 transition-colors'>
      <Image src={notifications} alt='notifications' width={24} height={24} />
      {unreadCount > 0 && (
        <div
          className={cn(
            'absolute -top-1 -right-1 h-5 min-w-5',
            'bg-primary text-background text-md font-bold',
            'flex items-center justify-center rounded-full'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  )
}

export default Notifications
