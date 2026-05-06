'use client'

import React from 'react'
import { format } from 'date-fns'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'

interface Props {
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
}

const MessageRow: React.FC<Props> = ({ message, isOwn, isRead }) => {
  const isDeleted = !!message.deleted_at
  const time = format(new Date(message.created_at), 'h:mm a')
  const decryptionFailed = !!message.decryption_failed
  const display = decryptionFailed ? 'Unable to decrypt this message' : (message.decrypted_body ?? message.body)

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[80%] flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'w-fit rounded-2xl px-4 py-2 text-lg break-words whitespace-pre-wrap',
            isOwn ? 'bg-primary text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
            (isDeleted || decryptionFailed) && 'italic opacity-60'
          )}
        >
          {isDeleted ? 'This message was deleted' : display}
        </div>
        <span className={cn('text-neutral text-sm', isOwn ? 'text-right' : 'text-left')}>
          {isOwn && isRead ? 'Seen •' : ''} {time}
        </span>
      </div>
    </div>
  )
}

export default MessageRow
