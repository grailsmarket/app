'use client'

import React from 'react'
import Link from 'next/link'
import { DEFAULT_FALLBACK_AVATAR, ImageWithFallback } from 'ethereum-identity-kit'
import { GLOBAL_CHAT_ID } from '@/constants/chat'
import { cn } from '@/utils/tailwind'
import type { ChatMessage } from '@/types/chat'
import ReactionPills from '../reactions/reactionPills'
import ReactionHoverZone from '../reactions/reactionHoverZone'
import { useMessage } from '../../hooks/useMessage'

interface Props {
  message: ChatMessage
  isOwn: boolean
  showHeader: boolean
}

const GlobalMessageRow: React.FC<Props> = ({ message, isOwn, showHeader }) => {
  const { time, senderLabel, canReact, onToggle, onPick, body, isDeleted, senderAddress, senderProfile } = useMessage(
    message,
    GLOBAL_CHAT_ID
  )

  return (
    <div
      className={cn(
        'flex w-full gap-2',
        showHeader ? 'mt-1' : 'mt-0',
        message.reactions && message.reactions.length > 0 && 'mb-1'
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
          <ReactionHoverZone canReact={canReact} onPick={onPick} buttonSide='right' className='max-w-[90%]'>
            <div className='bg-secondary p-md flex flex-col gap-0.5 rounded-md'>
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
              <div
                className={cn(
                  'text-foreground w-fit max-w-full break-before-all text-lg wrap-anywhere whitespace-pre-wrap',
                  isDeleted && 'text-neutral italic'
                )}
              >
                {body}
              </div>
            </div>
          </ReactionHoverZone>
          <ReactionPills reactions={message.reactions} canReact={canReact} onToggle={onToggle} />
        </div>
      </div>
    </div>
  )
}

export default GlobalMessageRow
