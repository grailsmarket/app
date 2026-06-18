'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import ReactionPills from '../reactions/reactionPills'
import MessageHoverActions from '../messageHoverActions'
import MessageEditor from '../messageEditor'
import ReplyPreview from '../replyPreview'
import ChatImages from '../chatImages'
import { useMessage } from '../../hooks/useMessage'
import { useMessageActions } from '../../hooks/useMessageActions'
import { startsNewRun } from '@/utils/chat/message'

interface Props {
  chatId: string
  message: ChatMessage
  isOwn: boolean
  isRead: boolean
  onReply?: (message: ChatMessage) => void
  /** Play the subtle entrance animation (set for messages received live). */
  animate?: boolean
  menuPosition: 'top' | 'bottom'
  next: ChatMessage | null
}

const MessageRow: React.FC<Props> = ({ chatId, message, isOwn, isRead, onReply, animate, menuPosition, next }) => {
  const { time, canReact, onToggle, onPick, body, isDeleted, isEdited } = useMessage(message, chatId)
  const { menuItems, canReply, isEditing, draft, setDraft, saveEdit, cancelEdit, editError, isSaving } =
    useMessageActions(message, chatId, isOwn, onReply)

  const showTime = startsNewRun(message, next)

  return (
    <div className={cn('flex w-full hover:z-10', isOwn ? 'justify-end' : 'justify-start', animate && 'messageIn')}>
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
            <MessageHoverActions
              position={menuPosition}
              canReact={canReact}
              onPick={onPick}
              canReply={canReply}
              onReply={() => onReply?.(message)}
              menuItems={menuItems}
              side={isOwn ? 'left' : 'right'}
              className='w-fit max-w-[92.5%]'
            >
              <div
                className={cn(
                  'relative w-fit break-before-all rounded-2xl px-4 py-2 text-lg wrap-anywhere whitespace-pre-wrap',
                  isOwn ? 'bg-primary text-background rounded-br-sm' : 'bg-secondary text-foreground rounded-bl-sm',
                  isDeleted && 'italic opacity-60'
                )}
              >
                {!isDeleted && message.reply_to && <ReplyPreview replyTo={message.reply_to} onOwnBubble={isOwn} />}
                {!isDeleted && message.attachments.length > 0 && (
                  <div className={cn(message.body && 'mb-1')}>
                    <ChatImages chatId={chatId} attachments={message.attachments} />
                  </div>
                )}
                {body}
                {isEdited && <span className='ml-1 text-sm opacity-70'>(edited)</span>}
                {/* {showTime && (
                  <p
                    className={cn(
                      'text-neutral absolute -bottom-0.5 shrink-0 text-sm text-nowrap',
                      isOwn ? 'right-[calc(100%+6px)]' : 'left-[calc(100%+4px)]'
                    )}
                  >
                    {isOwn && isRead ? 'Seen • ' : ''}
                    {time}
                  </p>
                )} */}
              </div>
            </MessageHoverActions>
            <ReactionPills
              chatId={chatId}
              messageId={message.id}
              reactions={message.reactions}
              canReact={canReact}
              onToggle={onToggle}
              className={isOwn ? 'justify-end' : 'justify-start'}
            />
            {showTime && (
              <p className='text-neutral text-sm text-nowrap'>
                {isOwn && isRead ? 'Seen • ' : ''}
                {time}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default MessageRow
