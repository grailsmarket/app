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

const Notifications = () => {
  const dispatch = useAppDispatch()

  // Fetch unread count
  const { data: unreadCount = 0, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: getUnreadCount,
    refetchInterval: 60000, // Refetch every minute
    retry: 1, // Only retry once on failure
    enabled: true, // Always try to fetch
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
    <button
      onClick={handleClick}
      className="relative p-2 hover:bg-primary/10 rounded-md transition-colors"
    >
      <Image src={notifications} alt='notifications' width={24} height={24} />
      {unreadCount > 0 && (
        <div className={cn(
          "absolute top-0 right-0 min-w-5 h-5",
          "bg-primary text-background text-md font-bold",
          "rounded-full flex items-center justify-center"
        )}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
    </button>
  )
}

export default Notifications
