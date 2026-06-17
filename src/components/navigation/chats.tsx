'use client'

import React from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { closeChatSidebar, openSidebarToList, selectChatSidebar } from '@/state/reducers/chat/sidebar'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import { cn } from '@/utils/tailwind'
import chatIcon from 'public/icons/chat.svg'

const Chats: React.FC = () => {
  const dispatch = useAppDispatch()
  const { open } = useAppSelector(selectChatSidebar)
  // Inbox query is auth-gated, so the unread badge no-ops for signed-out
  // visitors — they can still open the sidebar for the global chat.
  const { totalUnread } = useChatsInbox()

  return (
    <button
      type='button'
      onClick={() => dispatch(open ? closeChatSidebar() : openSidebarToList())}
      className='relative flex shrink-0 cursor-pointer items-center justify-center rounded-md'
      aria-label='Messages'
      aria-pressed={open}
    >
      <Image src={chatIcon} alt='Messages' width={24} height={24} className='h-5 w-5 md:h-6 md:w-6' />
      {totalUnread > 0 && (
        <div
          className={cn(
            'absolute -top-1 -right-1 h-5 min-w-5',
            'bg-primary text-background text-md font-bold',
            'flex items-center justify-center rounded-full px-1'
          )}
        >
          {totalUnread > 99 ? '99+' : totalUnread}
        </div>
      )}
    </button>
  )
}

export default Chats
