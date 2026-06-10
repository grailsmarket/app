'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import type { MessageReaction } from '@/types/chat'
import EmojiPickerPopover from './emojiPickerPopover'

interface Props {
  reactions?: MessageReaction[]
  /** FALSE for anonymous viewers — pills render read-only and the "+" is hidden. */
  canReact: boolean
  onToggle: (emoji: string, currentlyReacted: boolean) => void
  className?: string
}

/** Per-emoji reaction pills under a message bubble. Renders nothing when empty. */
const ReactionPills: React.FC<Props> = ({ reactions, canReact, onToggle, className }) => {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const addRef = useRef<HTMLButtonElement>(null)

  if (!reactions || reactions.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1', className)}>
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={
            canReact
              ? (e) => {
                  e.stopPropagation()
                  onToggle(r.emoji, r.reacted)
                }
              : undefined
          }
          disabled={!canReact}
          className={cn(
            'flex items-center gap-1 rounded-full border px-2 py-0.5 transition-colors',
            r.reacted ? 'border-primary bg-primary/15 text-foreground' : 'border-tertiary bg-secondary text-neutral',
            canReact ? 'hover:border-primary/60 cursor-pointer' : 'cursor-default'
          )}
          aria-label={`${r.emoji} ${r.count}${r.reacted ? ' (you reacted)' : ''}`}
          aria-pressed={canReact ? r.reacted : undefined}
        >
          <span className='text-md leading-none'>{r.emoji}</span>
          <span className='text-sm font-semibold'>{r.count}</span>
        </button>
      ))}
      {canReact && (
        <button
          ref={addRef}
          onClick={(e) => {
            e.stopPropagation()
            setAnchorRect(addRef.current?.getBoundingClientRect() ?? null)
          }}
          className='border-tertiary bg-secondary text-neutral hover:text-foreground hover:border-primary/60 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border text-sm font-bold transition-colors'
          aria-label='Add reaction'
        >
          +
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
