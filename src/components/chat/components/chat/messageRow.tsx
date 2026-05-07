'use client'

import React, { useMemo } from 'react'
import { format } from 'date-fns'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import { linkifyMessage } from '../../utils/linkifyMessage'
import { useAppDispatch } from '@/state/hooks'
import { closeChatSidebar } from '@/state/reducers/chat/sidebar'

interface Props {
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
}

const MessageRow: React.FC<Props> = ({ message, isOwn, isRead }) => {
  const dispatch = useAppDispatch()
  const isDeleted = !!message.deleted_at
  const time = format(new Date(message.created_at), 'h:mm a')

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
        <div
          className={cn(
            'w-fit break-before-all rounded-2xl px-4 py-2 text-lg wrap-anywhere',
            isOwn ? 'bg-primary text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
            isDeleted && 'italic opacity-60'
          )}
        >
          {body}
        </div>
        <span className={cn('text-neutral text-sm', isOwn ? 'text-right' : 'text-left')}>
          {isOwn && isRead ? 'Seen •' : ''} {time}
        </span>
      </div>
    </div>
  )
}

export default MessageRow
