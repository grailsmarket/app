'use client'

import React from 'react'
import { format } from 'date-fns'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import { useDecryptedBody } from '@/hooks/chat/useDecryptedBody'

interface Props {
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
}

const MessageRow: React.FC<Props> = ({ message, isOwn, isRead }) => {
  const isDeleted = !!message.deleted_at
  const { body: displayBody, status } = useDecryptedBody(message)
  const time = format(new Date(message.created_at), 'h:mm a')

  const content = isDeleted
    ? 'This message was deleted'
    : status === 'locked'
      ? '🔒 Encrypted — unlock to read'
      : status === 'failed'
        ? '⚠️ Could not decrypt — sender may need to re-send keys'
        : status === 'decrypting'
          ? '…'
          : displayBody

  const isPlaceholder = isDeleted || status === 'locked' || status === 'failed' || status === 'decrypting' || status === 'handshake'

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex max-w-[80%] flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'w-fit rounded-2xl px-4 py-2 text-lg break-words whitespace-pre-wrap',
            isOwn ? 'bg-primary text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
            isPlaceholder && 'italic opacity-60'
          )}
        >
          {content}
        </div>
        <span className={cn('text-neutral text-sm', isOwn ? 'text-right' : 'text-left')}>
          {isOwn && isRead ? 'Seen •' : ''} {time}
          {/* Lock badge on rows that arrived encrypted and were successfully
              decrypted, so users can tell at a glance which messages were
              transit-encrypted vs. sent in plaintext (the per-chat toggle
              lets a user opt out, so the two can coexist in one history). */}
          {status === 'decrypted' && (
            <span className='ml-1' title='End-to-end encrypted' aria-label='End-to-end encrypted'>
              🔒
            </span>
          )}
        </span>
      </div>
    </div>
  )
}

export default MessageRow
