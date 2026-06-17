'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import type { MessageReaction } from '@/types/chat'
import EmojiPickerPopover from './emojiPickerPopover'
import ReactionPill from './reactionPill'
import Image from 'next/image'
import addIcon from 'public/icons/cross.svg'
interface Props {
  chatId: string
  messageId: string
  reactions?: MessageReaction[]
  /** FALSE for anonymous viewers — pills render read-only and the "+" is hidden. */
  canReact: boolean
  onToggle: (emoji: string, currentlyReacted: boolean) => void
  className?: string
}

/** Per-emoji reaction pills under a message bubble. Renders nothing when empty. */
const ReactionPills: React.FC<Props> = ({ chatId, messageId, reactions, canReact, onToggle, className }) => {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const addRef = useRef<HTMLButtonElement>(null)

  if (!reactions || reactions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {reactions.map((r) => (
        <ReactionPill
          key={r.emoji}
          chatId={chatId}
          messageId={messageId}
          reaction={r}
          canReact={canReact}
          onToggle={onToggle}
        />
      ))}
      {canReact && (
        <button
          ref={addRef}
          onClick={(e) => {
            e.stopPropagation()
            setAnchorRect(addRef.current?.getBoundingClientRect() ?? null)
          }}
          className='border-tertiary bg-secondary text-neutral hover:text-foreground hover:border-primary/60 flex h-[21px] w-[21px] cursor-pointer items-center justify-center rounded-sm border text-sm font-bold transition-colors'
          aria-label='Add reaction'
        >
          <Image src={addIcon} alt='Add reaction' width={8} height={8} className='rotate-45' />
        </button>
      )}
      {anchorRect && (
        <EmojiPickerPopover
          anchorRect={anchorRect}
          initialExpanded
          onPick={(emoji) => {
            const existing = reactions.find((r) => r.emoji === emoji)
            onToggle(emoji, existing?.reacted ?? false)
          }}
          onClose={() => setAnchorRect(null)}
        />
      )}
    </div>
  )
}

export default ReactionPills
