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
  const { menuItems, isEditing, draft, setDraft, saveEdit, cancelEdit, editError, isSaving } = useMessageActions(
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
            <MessageEditor
              value={draft}
              onChange={setDraft}
              onSave={saveEdit}
              onCancel={cancelEdit}
              error={editError}
              saving={isSaving}
            />
          </div>
        ) : (
          <>
            {/* Kebab sits on the OUTER edge, opposite the reaction picker (which is
                on the inner side per buttonSide), so the two never overlap: other
                users' messages → kebab left (menu opens right into the panel); own
                messages → kebab right (menu opens left into the panel). */}
            <div className='flex max-w-[80%] items-start gap-1'>
              {!isOwn && menuItems.length > 0 && (
                <ContextMenu items={menuItems} align='left' className='mt-1 shrink-0' label='Message options' />
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
                  {!isDeleted && message.reply_to && <ReplyPreview replyTo={message.reply_to} onOwnBubble={isOwn} />}
                  {body}
                  {isEdited && <span className='ml-1 text-sm opacity-70'>(edited)</span>}
                </div>
              </ReactionHoverZone>
              {isOwn && menuItems.length > 0 && (
                <ContextMenu items={menuItems} align='right' className='mt-1 shrink-0' label='Message options' />
              )}
            </div>
            <ReactionPills
              chatId={chatId}
              messageId={message.id}
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
