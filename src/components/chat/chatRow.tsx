'use client'

import React from 'react'
import { Avatar } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToThread } from '@/state/reducers/chat/sidebar'
import { useUserContext } from '@/context/user'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { cn } from '@/utils/tailwind'
import type { Chat, ChatParticipant } from '@/types/chat'

interface Props {
  chat: Chat
}

const otherParticipant = (chat: Chat, myAddress: string | undefined): ChatParticipant | null => {
  if (!chat.participants || !myAddress) return null
  const me = myAddress.toLowerCase()
  return chat.participants.find((p) => p.address.toLowerCase() !== me) ?? chat.participants[0] ?? null
}

const ChatRow: React.FC<Props> = ({ chat }) => {
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()

  const peer = otherParticipant(chat, userAddress)
  const peerProfile = usePeerProfile(peer?.address)
  const peerLabel = peerProfile?.displayLabel ?? 'Direct chat'
  const unread = chat.unread_count ?? 0

  const lastBody = chat.last_message?.deleted_at
    ? 'Message deleted'
    : (chat.last_message?.body ?? '')
  const time = chat.last_message_at ? formatTimeAgo(chat.last_message_at) : ''

  return (
    <button
      onClick={() => dispatch(openSidebarToThread({ chatId: chat.id }))}
      className={cn(
        'border-secondary flex w-full items-center gap-3 border-b p-3 text-left transition-colors hover:bg-white/5',
        unread > 0 && 'bg-primary/5'
      )}
    >
      {peer ? (
        <Avatar
          address={peer.address as `0x${string}`}
          src={peerProfile?.avatar ?? undefined}
          name={peerProfile?.ensName ?? undefined}
          style={{ width: '40px', height: '40px' }}
        />
      ) : (
        <div className='bg-tertiary h-10 w-10 rounded-full' />
      )}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-foreground truncate text-lg font-semibold'>{peerLabel}</p>
          {time && <span className='text-neutral text-sm font-medium whitespace-nowrap'>{time}</span>}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <p className={cn('text-md truncate', unread > 0 ? 'text-foreground' : 'text-neutral')}>
            {lastBody || 'No messages yet'}
          </p>
          {unread > 0 && (
            <span className='bg-primary text-background flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-sm font-bold'>
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export default ChatRow
