'use client'

import React from 'react'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToGlobal } from '@/state/reducers/chat/sidebar'
import { useGlobalMessages } from '@/hooks/chat/useGlobalMessages'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { formatAddress } from '@/utils/formatAddress'
import { cn } from '@/utils/tailwind'
import Logo from 'public/logo.svg'

/** Pinned entry for the global room at the top of the chats list. */
const GlobalChatRow: React.FC = () => {
  const dispatch = useAppDispatch()
  const { messages } = useGlobalMessages()

  const newest = messages[messages.length - 1]
  const senderLabel = newest ? (newest.sender_ens_name ?? formatAddress(newest.sender_address ?? '')) : null
  const preview = newest
    ? newest.deleted_at
      ? 'Message deleted'
      : `${senderLabel}: ${newest.body ?? ''}`
    : 'Talk to the whole Grails community'
  const time = newest ? formatTimeAgo(newest.created_at) : ''

  const open = () => dispatch(openSidebarToGlobal())
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      className={cn(
        'border-tertiary bg-primary/5 relative flex w-full cursor-pointer items-center gap-3 border-b-2 p-3 text-left transition-colors hover:bg-white/5'
      )}
    >
      <div className='bg-background border-tertiary flex h-10 w-10 shrink-0 items-center justify-center rounded-full border'>
        <Image src={Logo} alt='Grails' width={26} height={26} className='h-6.5 w-6.5' />
      </div>
      <div className='relative min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-foreground truncate text-lg font-semibold'>Grails Chat</p>
          {time && <span className='text-neutral text-sm font-medium whitespace-nowrap'>{time}</span>}
        </div>
        <p className='text-md text-neutral truncate'>{preview}</p>
      </div>
    </div>
  )
}

export default GlobalChatRow
