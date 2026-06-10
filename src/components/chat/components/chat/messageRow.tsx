'use client'

import React, { useMemo } from 'react'
import { format } from 'date-fns'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import { linkifyMessage } from '../../utils/linkifyMessage'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar } from '@/state/reducers/chat/sidebar'
import { useUserContext } from '@/context/user'
import { useToggleReaction } from '@/hooks/chat/useToggleReaction'
import ReactionPills from '../reactions/reactionPills'
import ReactionHoverZone from '../reactions/reactionHoverZone'

interface Props {
  chatId: string
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
}

const MessageRow: React.FC<Props> = ({ chatId, message, isOwn, isRead }) => {
  const dispatch = useAppDispatch()
  const { authStatus } = useUserContext()
  const toggleReaction = useToggleReaction(chatId)
  const isDeleted = !!message.deleted_at
  const time = format(new Date(message.created_at), 'h:mm a')

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
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[80%] flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <ReactionHoverZone canReact={canReact} onPick={onPick} buttonSide={isOwn ? 'left' : 'right'}>
          <div
            className={cn(
              'w-fit break-before-all rounded-2xl px-4 py-2 text-lg wrap-anywhere whitespace-pre-wrap',
              isOwn ? 'bg-primary text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
              isDeleted && 'italic opacity-60'
            )}
          >
            {body}
          </div>
        </ReactionHoverZone>
        <ReactionPills
          reactions={message.reactions}
          canReact={canReact}
          onToggle={onToggle}
          className={isOwn ? 'justify-end' : 'justify-start'}
        />
        <span className={cn('text-neutral text-sm', isOwn ? 'text-right' : 'text-left')}>
          {isOwn && isRead ? 'Seen •' : ''} {time}
        </span>
      </div>
    </div>
  )
}

export default MessageRow
