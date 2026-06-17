'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'

// The full picker (and its emoji data fetching) is only loaded once a popover
// is actually expanded.
const FrimoussePicker = dynamic(() => import('./frimoussePicker'), {
  ssr: false,
  loading: () => (
    <div className='bg-secondary border-tertiary text-neutral flex h-80 w-72 items-center justify-center rounded-md border-2 text-sm shadow-lg'>
      Loading…
    </div>
  ),
})

export const QUICK_EMOJIS = ['👍', '❤️', '😂', '🔥', '😮', '🫡']

interface Props {
  /** Viewport rect of the element the popover anchors to (captured at open time). */
  anchorRect: DOMRect
  onPick: (emoji: string) => void
  onClose: () => void
  /** Skip the quick row and open the full picker straight away. */
  initialExpanded?: boolean
}

const PICKER_WIDTH = 288 // w-72
const PICKER_HEIGHT = 320 // h-80
const QUICK_HEIGHT = 48

/**
 * Fixed-position popover (so it never clips inside the messages scroll
 * container) with a quick reaction row that expands to the full emoji picker.
 * Closes on outside click and Escape.
 */
const EmojiPickerPopover: React.FC<Props> = ({ anchorRect, onPick, onClose, initialExpanded = false }) => {
  const [expanded, setExpanded] = useState(initialExpanded)
  const ref = useClickAway<HTMLDivElement>(onClose)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Place above the anchor when there's room for the (worst-case) expanded
  // picker, otherwise below. Clamp horizontally to the viewport.
  const height = expanded ? PICKER_HEIGHT : QUICK_HEIGHT
  const placeAbove = anchorRect.top > height + 16
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 110, // above the chat sidebar (z-91)
    left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - PICKER_WIDTH - 8)),
    ...(placeAbove
      ? { bottom: window.innerHeight - anchorRect.top + 6 }
      : { top: Math.min(anchorRect.bottom + 6, window.innerHeight - height - 8) }),
  }

  const pick = (emoji: string) => {
    onPick(emoji)
    onClose()
  }

  return (
    <div ref={ref} style={style} onClick={(e) => e.stopPropagation()}>
      {expanded ? (
        <FrimoussePicker onPick={pick} />
      ) : (
        <div className='bg-secondary border-tertiary flex items-center gap-0.5 rounded-full border-2 p-1 shadow-lg'>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => pick(emoji)}
              className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xl transition-transform hover:scale-115'
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
          <button
            onClick={() => setExpanded(true)}
            className={cn(
              'text-neutral hover:text-foreground hover:bg-primary/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg font-bold transition-colors'
            )}
            aria-label='More emojis'
          >
            …
          </button>
        </div>
      )}
    </div>
  )
}

export default EmojiPickerPopover
