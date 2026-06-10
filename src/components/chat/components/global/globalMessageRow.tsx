'use client'

import React, { useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Avatar } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar } from '@/state/reducers/chat/sidebar'
import { useUserContext } from '@/context/user'
import { useToggleReaction } from '@/hooks/chat/useToggleReaction'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import { formatAddress } from '@/utils/formatAddress'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import { linkifyMessage } from '../../utils/linkifyMessage'
import ReactionPills from '../reactions/reactionPills'
import ReactionHoverZone from '../reactions/reactionHoverZone'

interface Props {
  message: ChatMessage
  isOwn: boolean
  /** Show the avatar + sender header (sender changed, >5 min gap, or new day). */
  showHeader: boolean
}

/**
 * Group-chat style row: everything left-aligned with an avatar gutter; the
 * avatar + sender name only render at the start of a sender run. Own messages
 * get a highlighted name color instead of right-alignment.
 */
const GlobalMessageRow: React.FC<Props> = ({ message, isOwn, showHeader }) => {
  const dispatch = useAppDispatch()
  const { authStatus } = useUserContext()
  const toggleReaction = useToggleReaction(GLOBAL_CHAT_ID)

  const isDeleted = !!message.deleted_at
  const time = format(new Date(message.created_at), 'h:mm a')
  const senderAddress = message.sender_address
  const senderLabel = message.sender_ens_name ?? (senderAddress ? formatAddress(senderAddress) : 'Unknown')

  const canReact = authStatus === 'authenticated' && !isDeleted && !message.id.startsWith('optimistic-')

  const onToggle = (emoji: string, currentlyReacted: boolean) => {
    toggleReaction.mutate({ messageId: message.id, emoji, currentlyReacted })
  }

  // Picker selections don't know the current state — resolve it so picking an
  // already-reacted emoji toggles it off instead of double-counting.
  const onPick = (emoji: string) => {
    const existing = message.reactions?.find((r) => r.emoji === emoji)
    onToggle(emoji, existing?.reacted ?? false)
  }

  const body = useMemo(() => {
    if (isDeleted) return 'This message was deleted'
    return linkifyMessage(message.body ?? '', {
      onClick: () => {
        dispatch(closeChatSidebar())
      },
    })
  }, [isDeleted, message.body])

  return (
    <div className={cn('flex w-full gap-2', showHeader ? 'mt-1' : 'mt-0')}>
      {/* Avatar gutter — kept for alignment even when the header is hidden */}
      <div className='w-9 shrink-0'>
        {showHeader && senderAddress && (
          <Link
            href={`/profile/${senderAddress}`}
            prefetch
            onClick={() => dispatch(closeChatSidebar())}
            className='block transition-opacity hover:opacity-80'
          >
            <Avatar
              key={`${message.id}-avatar`}
              address={senderAddress as `0x${string}`}
              src={message.sender_avatar ?? undefined}
              name={message.sender_ens_name ?? undefined}
              style={{ width: '36px', height: '36px' }}
            />
          </Link>
        )}
      </div>
      <div className='flex min-w-0 flex-1 flex-col items-start gap-0.5'>
        {showHeader && (
          <div className='flex items-baseline gap-2'>
            <Link
              href={`/profile/${senderAddress}`}
              prefetch
              onClick={() => dispatch(closeChatSidebar())}
              className={cn(
                'text-md truncate font-semibold transition-opacity hover:opacity-80',
                isOwn ? 'text-primary' : 'text-foreground'
              )}
            >
              {senderLabel}
            </Link>
            <span className='text-neutral text-sm whitespace-nowrap'>{time}</span>
          </div>
        )}
        <ReactionHoverZone canReact={canReact} onPick={onPick} buttonSide='right' className='max-w-full'>
          <div
            className={cn(
              'text-foreground w-fit max-w-full break-before-all text-lg wrap-anywhere whitespace-pre-wrap',
              isDeleted && 'text-neutral italic'
            )}
          >
            {body}
          </div>
        </ReactionHoverZone>
        <ReactionPills reactions={message.reactions} canReact={canReact} onToggle={onToggle} />
      </div>
    </div>
  )
}

export default GlobalMessageRow
