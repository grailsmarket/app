'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import type { MessageReaction } from '@/types/chat'
import ReactorsPopover from './reactorsPopover'
import { LONG_PRESS_MS, LONG_PRESS_MOVE_CANCEL_PX } from './constants'

const OPEN_DELAY_MS = 250
const CLOSE_DELAY_MS = 200

interface Props {
  chatId: string
  messageId: string
  reaction: MessageReaction
  /** FALSE for anonymous viewers — the pill is read-only (no toggle). */
  canReact: boolean
  onToggle: (emoji: string, currentlyReacted: boolean) => void
}

/**
 * A single reaction pill. Click toggles the caller's reaction; hovering
 * (desktop) or long-pressing (mobile) opens a popover listing who reacted with
 * this emoji. A long-press suppresses the subsequent click so it doesn't also
 * toggle.
 */
const ReactionPill: React.FC<Props> = ({ chatId, messageId, reaction, canReact, onToggle }) => {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)
  const longPressFired = useRef(false)

  const clearTimer = (t: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (t.current) {
      clearTimeout(t.current)
      t.current = null
    }
  }

  // Clear any pending hover/long-press timers on unmount — a pill unmounts when
  // its emoji count drops to 0, and a stray timer would setState afterwards.
  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current)
      if (closeTimer.current) clearTimeout(closeTimer.current)
      if (pressTimer.current) clearTimeout(pressTimer.current)
    },
    []
  )

  const open = () => setAnchorRect(btnRef.current?.getBoundingClientRect() ?? null)
  const close = () => setAnchorRect(null)

  // Desktop hover, with a small open delay (avoid flicker) and close delay (let
  // the cursor travel into the popover, which cancels the close).
  const onMouseEnter = () => {
    clearTimer(closeTimer)
    openTimer.current = setTimeout(open, OPEN_DELAY_MS)
  }
  const onMouseLeave = () => {
    clearTimer(openTimer)
    closeTimer.current = setTimeout(close, CLOSE_DELAY_MS)
  }

  // Mobile long-press.
  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    longPressFired.current = false
    pressOrigin.current = { x: touch.clientX, y: touch.clientY }
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true
      open()
    }, LONG_PRESS_MS)
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const origin = pressOrigin.current
    if (!touch || !origin) return
    if (Math.hypot(touch.clientX - origin.x, touch.clientY - origin.y) > LONG_PRESS_MOVE_CANCEL_PX) {
      clearTimer(pressTimer)
    }
  }
  const onTouchEnd = () => clearTimer(pressTimer)

  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // A long-press already opened the viewer — don't also toggle on release.
    if (longPressFired.current) {
      longPressFired.current = false
      return
    }
    if (canReact) onToggle(reaction.emoji, reaction.reacted)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        className={cn(
          'flex items-center gap-1 rounded-sm border py-0.5 pr-1.5 pl-1 transition-colors',
          reaction.reacted
            ? 'border-primary bg-primary/15 text-foreground'
            : 'border-tertiary bg-secondary text-neutral',
          canReact ? 'hover:border-primary/60 cursor-pointer' : 'cursor-default'
        )}
        aria-label={`${reaction.emoji} ${reaction.count}${reaction.reacted ? ' (you reacted)' : ''}`}
        aria-pressed={canReact ? reaction.reacted : undefined}
      >
        <span className='text-md leading-none'>{reaction.emoji}</span>
        <span className='text-sm font-semibold'>{reaction.count}</span>
      </button>
      {anchorRect && (
        <ReactorsPopover
          chatId={chatId}
          messageId={messageId}
          emoji={reaction.emoji}
          anchorRect={anchorRect}
          onClose={close}
          onMouseEnter={() => clearTimer(closeTimer)}
          onMouseLeave={() => {
            closeTimer.current = setTimeout(close, CLOSE_DELAY_MS)
          }}
        />
      )}
    </>
  )
}

export default ReactionPill
