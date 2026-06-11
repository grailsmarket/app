'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import ReactionPills from '../reactions/reactionPills'
import ReactionHoverZone from '../reactions/reactionHoverZone'
import { useMessage } from '../../hooks/useMessage'

interface Props {
  chatId: string
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
}

const MessageRow: React.FC<Props> = ({ chatId, message, isOwn, isRead }) => {
  const { time, canReact, onToggle, onPick, body, isDeleted } = useMessage(message, chatId)

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex w-full flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <ReactionHoverZone
          canReact={canReact}
          onPick={onPick}
          buttonSide={isOwn ? 'left' : 'right'}
          className={cn('flex w-fit! max-w-[80%]', isOwn ? 'justify-end' : 'justify-start')}
        >
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
