'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import ReactionPills from '../reactions/reactionPills'
import ReactionHoverZone from '../reactions/reactionHoverZone'
import ContextMenu from '@/components/ui/contextMenu'
import MessageEditor from '../messageEditor'
import ReplyPreview from '../replyPreview'
import { useMessage } from '../../hooks/useMessage'
import { useMessageActions } from '../../hooks/useMessageActions'

interface Props {
  chatId: string
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
  onReply?: (message: ChatMessage) => void
}

const MessageRow: React.FC<Props> = ({ chatId, message, isOwn, isRead, onReply }) => {
  const { time, canReact, onToggle, onPick, body, isDeleted, isEdited } = useMessage(message, chatId)
  const { menuItems, isEditing, draft, setDraft, saveEdit, cancelEdit } = useMessageActions(
    message,
    chatId,
    isOwn,
    onReply
  )

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('flex w-full flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        {isEditing ? (
          <div className='w-full max-w-[80%]'>
            <MessageEditor value={draft} onChange={setDraft} onSave={saveEdit} onCancel={cancelEdit} />
          </div>
        ) : (
          <>
            <div className='flex max-w-[80%] items-start gap-1'>
              {menuItems.length > 0 && (
                <ContextMenu items={menuItems} className='mt-1 shrink-0' label='Message options' />
              )}
              <ReactionHoverZone
                canReact={canReact}
                onPick={onPick}
                buttonSide={isOwn ? 'left' : 'right'}
                className={cn('flex w-fit!', isOwn ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'w-fit break-before-all rounded-2xl px-4 py-2 text-lg wrap-anywhere whitespace-pre-wrap',
                    isOwn ? 'bg-primary text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
                    isDeleted && 'italic opacity-60'
                  )}
                >
                  {!isDeleted && message.reply_to && <ReplyPreview replyTo={message.reply_to} />}
                  {body}
                  {isEdited && <span className='ml-1 text-sm opacity-70'>(edited)</span>}
                </div>
              </ReactionHoverZone>
            </div>
            <ReactionPills
              reactions={message.reactions}
              canReact={canReact}
              onToggle={onToggle}
              className={isOwn ? 'justify-end' : 'justify-start'}
            />
            <span className={cn('text-neutral text-sm', isOwn ? 'text-right' : 'text-left')}>
              {isOwn && isRead ? 'Seen •' : ''} {time}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

export default MessageRow
