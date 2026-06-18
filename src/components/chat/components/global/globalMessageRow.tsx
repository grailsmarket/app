'use client'

import React from 'react'
import Link from 'next/link'
import { DEFAULT_FALLBACK_AVATAR, ImageWithFallback } from 'ethereum-identity-kit'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import ReactionPills from '../reactions/reactionPills'
import MessageHoverActions from '../messageHoverActions'
import MessageEditor from '../messageEditor'
import ReplyPreview from '../replyPreview'
import { useMessage } from '../../hooks/useMessage'
import { useMessageActions } from '../../hooks/useMessageActions'

interface Props {
  message: ChatMessage
  isOwn: boolean
  showHeader: boolean
  onReply?: (message: ChatMessage) => void
  animate?: boolean
  menuPosition: 'top' | 'bottom'
}

const GlobalMessageRow: React.FC<Props> = ({ message, isOwn, showHeader, onReply, animate, menuPosition }) => {
  const { time, senderLabel, canReact, onToggle, onPick, body, isDeleted, isEdited, senderAddress, senderProfile } =
    useMessage(message, GLOBAL_CHAT_ID)
  const { menuItems, canReply, isEditing, draft, setDraft, saveEdit, cancelEdit, editError, isSaving } =
    useMessageActions(message, GLOBAL_CHAT_ID, isOwn, onReply)

  return (
    <div
      className={cn(
        'flex w-full gap-2 hover:z-10',
        showHeader ? 'mt-1' : 'mt-0',
        message.reactions && message.reactions.length > 0 && 'mb-1',
        animate && 'messageIn'
      )}
    >
      {/* Avatar gutter — kept for alignment even when the header is hidden */}
      <div className='flex w-full max-w-full gap-2'>
        <div className='w-9 shrink-0'>
          {showHeader && senderAddress && (
            <Link href={`/profile/${senderAddress}`} prefetch className='block transition-opacity hover:opacity-80'>
              <ImageWithFallback
                fallback={DEFAULT_FALLBACK_AVATAR}
                key={`${message.id}-avatar`}
                src={senderProfile?.avatar ?? ''}
                alt={senderProfile?.ensName ?? ''}
                style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '50%' }}
              />
            </Link>
          )}
        </div>
        <div className='flex min-w-0 flex-1 flex-col items-start gap-1'>
          {isEditing ? (
            <MessageEditor
              value={draft}
              onChange={setDraft}
              onSave={saveEdit}
              onCancel={cancelEdit}
              error={editError}
              saving={isSaving}
            />
          ) : (
            <>
              {/* Reply / react / more reveal on hover, always to the right of the
                  bubble and vertically centered against it. */}
              <MessageHoverActions
                canReact={canReact}
                onPick={onPick}
                canReply={canReply}
                onReply={() => onReply?.(message)}
                menuItems={menuItems}
                side='right'
                position={menuPosition}
                isGlobal={true}
              >
                <div className='bg-secondary p-md flex h-full flex-col gap-0.5 rounded-md'>
                  {showHeader && (
                    <div className='flex items-baseline gap-2'>
                      <Link
                        href={`/profile/${senderAddress}`}
                        prefetch
                        className={cn(
                          'text-lg font-semibold wrap-anywhere transition-opacity hover:opacity-80',
                          isOwn ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {senderLabel}
                      </Link>
                      <span className='text-neutral text-sm whitespace-nowrap'>{time}</span>
                    </div>
                  )}
                  {!isDeleted && message.reply_to && <ReplyPreview replyTo={message.reply_to} />}
                  <div
                    className={cn(
                      'text-foreground w-fit max-w-full break-before-all text-lg wrap-anywhere whitespace-pre-wrap',
                      isDeleted && 'text-neutral italic'
                    )}
                  >
                    {body}
                    {isEdited && <span className='text-neutral ml-1 text-sm'>(edited)</span>}
                  </div>
                </div>
              </MessageHoverActions>
              <ReactionPills
                chatId={GLOBAL_CHAT_ID}
                messageId={message.id}
                reactions={message.reactions}
                canReact={canReact}
                onToggle={onToggle}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalMessageRow
