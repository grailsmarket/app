'use client'

import React from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import Bell from 'public/icons/bell.svg'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToGlobal, openSidebarToThread } from '@/state/reducers/chat/sidebar'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { formatAddress } from '@/utils/formatAddress'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import type { Notification } from '@/types/notifications'

interface Props {
  notification: Notification
  onClick?: () => void
}

/**
 * Row for chat reply / @-mention notifications. Resolves the actor's display
 * name and opens the relevant chat (global room or DM) on click, then closes
 * the notifications modal via the shared onClick.
 */
const ChatNotificationRow: React.FC<Props> = ({ notification, onClick }) => {
  const dispatch = useAppDispatch()
  const { metadata, type } = notification
  const profile = usePeerProfile(metadata.senderAddress as `0x${string}` | undefined)
  const who = profile?.displayLabel ?? (metadata.senderAddress ? formatAddress(metadata.senderAddress) : 'Someone')
  const action = type === 'chat_reply' ? 'replied to you' : 'mentioned you'
  const timeAgo = formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true }).replace('about ', '')

  const open = () => {
    if (metadata.chatId && metadata.chatId !== GLOBAL_CHAT_ID) {
      dispatch(openSidebarToThread({ chatId: metadata.chatId }))
    } else {
      dispatch(openSidebarToGlobal())
    }
    onClick?.()
  }

  return (
    <button
      onClick={open}
      className='p-md sm:p-lg flex w-full cursor-pointer items-center gap-3 text-left transition-colors hover:bg-white/5'
    >
      {!notification.isRead && <div className='bg-primary h-2 w-2 shrink-0 rounded-full' />}
      <Image src={Bell} alt='' width={26} height={26} className='h-5 w-5 shrink-0 sm:h-6 sm:w-6' />
      <div className='flex min-w-0 flex-1 flex-col gap-px'>
        <p className='text-foreground text-md font-medium sm:text-lg'>
          <span className='font-semibold'>{who}</span> {action}
        </p>
        {metadata.snippet && <p className='text-neutral line-clamp-1 text-sm'>{metadata.snippet}</p>}
      </div>
      <span className='text-neutral text-sm whitespace-nowrap'>{timeAgo}</span>
    </button>
  )
}

export default ChatNotificationRow
