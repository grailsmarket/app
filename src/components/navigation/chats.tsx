'use client'

import React from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToList } from '@/state/reducers/chat/sidebar'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import { cn } from '@/utils/tailwind'
import chatIcon from 'public/icons/chat.svg'

const Chats: React.FC = () => {
  const dispatch = useAppDispatch()
  // Inbox query is auth-gated, so the unread badge no-ops for signed-out
  // visitors — they can still open the sidebar for the global chat.
  const { totalUnread } = useChatsInbox()

  return (
    <button
      onClick={() => dispatch(openSidebarToList())}
      className='hover:bg-primary/10 relative rounded-md p-1 transition-colors'
      aria-label='Messages'
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
