'use client'

import React from 'react'
import { Avatar, HeaderImage } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { openSidebarToThread } from '@/state/reducers/chat/sidebar'
import { useUserContext } from '@/context/user'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { useBlockUser } from '@/hooks/chat/useBlockUser'
import { useUnblockUser } from '@/hooks/chat/useUnblockUser'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { cn } from '@/utils/tailwind'
import ContextMenu, { type ContextMenuItem } from '@/components/ui/contextMenu'
import type { Chat, ChatParticipant } from '@/types/chat'
import { ENS_METADATA_URL } from '@/constants/ens'
import { Address } from 'viem'
import { tryDecode } from '@/lib/e2e/wire'

interface Props {
  chat: Chat
}

const otherParticipant = (chat: Chat, myAddress: Address | null | undefined): ChatParticipant | null => {
  if (!chat.participants || !myAddress) return null
  const me = myAddress.toLowerCase() as Address
  return chat.participants.find((p) => p.address.toLowerCase() !== me) ?? chat.participants[0] ?? null
}

const ChatRow: React.FC<Props> = ({ chat }) => {
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()

  const peer = otherParticipant(chat, userAddress)
  const peerProfile = usePeerProfile(peer?.address)
  const peerLabel = peerProfile?.displayLabel ?? 'Direct chat'
  const unread = chat.unread_count ?? 0
  const isBlocked = !!chat.is_blocked_by_me

  const blockMutation = useBlockUser()
  const unblockMutation = useUnblockUser()

  const lastBody = chat.last_message?.deleted_at
    ? 'Message deleted'
    : tryDecode(chat.last_message?.body)
      ? '🔒 Encrypted message'
      : (chat.last_message?.body ?? '')
  const time = chat.last_message_at ? formatTimeAgo(chat.last_message_at) : ''

  const open = () => dispatch(openSidebarToThread({ chatId: chat.id }))
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  }

  const menuItems: ContextMenuItem[] = peer
    ? isBlocked
      ? [
          {
            label: `Unblock ${peerLabel}`,
            onClick: () => unblockMutation.mutate(peer.user_id),
          },
        ]
      : [
          {
            label: `Block ${peerLabel}`,
            confirmLabel: `Confirm block ${peerLabel}`,
            destructive: true,
            onClick: () => blockMutation.mutate(peer.address),
          },
        ]
    : []

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      data-testid='chat-inbox-row'
      title={isBlocked ? 'Blocked — open menu to unblock' : undefined}
      className={cn(
        'border-secondary relative flex w-full cursor-pointer items-center gap-3 border-b p-3 text-left transition-colors hover:bg-white/5',
        unread > 0 && !isBlocked && 'bg-primary/5',
        isBlocked && 'opacity-60'
      )}
    >
      {peer ? (
        <>
          {peerProfile?.records['header'] && (
            <HeaderImage
              name={peerProfile?.ensName ?? undefined}
              src={`${ENS_METADATA_URL}/mainnet/header/${peerProfile?.ensName}`}
              isLoading={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0.15,
              }}
            />
          )}
          <Avatar
            key={`${peer.address}-avatar`}
            address={peer.address}
            src={`${ENS_METADATA_URL}/mainnet/avatar/${peerProfile?.ensName}`}
            name={peerProfile?.ensName ?? undefined}
            style={{ width: '40px', height: '40px', zIndex: 10 }}
          />
        </>
      ) : (
        <div className='bg-tertiary h-10 w-10 rounded-full' />
      )}
      <div className='relative min-w-0 flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-foreground truncate text-lg font-semibold'>{peerLabel}</p>
          {time && <span className='text-neutral text-sm font-medium whitespace-nowrap'>{time}</span>}
        </div>
        <div className='flex items-center justify-between gap-2'>
          <p className={cn('text-md truncate', unread > 0 ? 'text-foreground' : 'text-neutral')}>
            {lastBody || 'No messages yet'}
          </p>
          {isBlocked ? (
            <span className='bg-secondary text-neutral flex items-center justify-center rounded-full px-2 py-0.5 text-sm font-semibold'>
              Blocked
            </span>
          ) : (
            unread > 0 && (
              <span className='bg-primary text-background flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-sm font-bold'>
                {unread > 99 ? '99+' : unread}
              </span>
            )
          )}
        </div>
      </div>
      {menuItems.length > 0 && <ContextMenu items={menuItems} />}
    </div>
  )
}

export default ChatRow
