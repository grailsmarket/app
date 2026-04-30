'use client'

import React from 'react'
import { format } from 'date-fns'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'

interface Props {
  message: ChatMessage
  isOwn: boolean
}

const MessageRow: React.FC<Props> = ({ message, isOwn }) => {
  const isDeleted = !!message.deleted_at
  const time = format(new Date(message.created_at), 'h:mm a')

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className='flex max-w-[80%] flex-col gap-1'>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-md whitespace-pre-wrap break-words',
            isOwn
              ? 'bg-primary text-background rounded-br-sm'
              : 'bg-secondary text-foreground rounded-bl-sm',
            isDeleted && 'italic opacity-60'
          )}
        >
          {isDeleted ? 'This message was deleted' : message.body}
        </div>
        <span className={cn('text-neutral text-sm', isOwn ? 'text-right' : 'text-left')}>{time}</span>
      </div>
    </div>
  )
}

export default MessageRow
