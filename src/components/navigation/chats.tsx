'use client'

import React from 'react'
import Image from 'next/image'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToList } from '@/state/reducers/chat/sidebar'
import { useChatsInbox } from '@/hooks/chat/useChatsInbox'
import { cn } from '@/utils/tailwind'
import chatIcon from 'public/icons/chat.svg'

const Chats: React.FC = () => {
  const { openConnectModal } = useConnectModal()
  const { userAddress } = useUserContext()
  const dispatch = useAppDispatch()
  const { totalUnread } = useChatsInbox()

  const handleClick = () => {
    if (!userAddress) return openConnectModal?.()
    dispatch(openSidebarToList())
  }

  return (
    <button
      onClick={handleClick}
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
