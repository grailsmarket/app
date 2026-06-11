'use client'

import React, { useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import EmojiPickerPopover from './emojiPickerPopover'

const LONG_PRESS_MS = 500
const LONG_PRESS_MOVE_CANCEL_PX = 10

interface Props {
  /** FALSE disables the hover button and long-press entirely (anonymous viewers). */
  canReact: boolean
  onPick: (emoji: string) => void
  /** Which side of the bubble the hover button sits on. */
  buttonSide?: 'left' | 'right'
  children: React.ReactNode
  className?: string
}

/**
 * Wraps a message bubble with reaction affordances: a smiley button revealed
 * on hover (desktop) and a 500ms long-press with movement cancel (touch).
 * Both open the quick-reaction popover.
 */
const ReactionHoverZone: React.FC<Props> = ({ canReact, onPick, buttonSide = 'right', children, className }) => {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressOrigin = useRef<{ x: number; y: number } | null>(null)

  const openFrom = (el: Element | null) => {
    if (el) setAnchorRect(el.getBoundingClientRect())
  }

  const cancelLongPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    pressOrigin.current = null
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return
    cancelLongPress()
    pressOrigin.current = { x: touch.clientX, y: touch.clientY }
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null
      openFrom(wrapRef.current)
    }, LONG_PRESS_MS)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const origin = pressOrigin.current
    if (!touch || !origin) return
    if (Math.hypot(touch.clientX - origin.x, touch.clientY - origin.y) > LONG_PRESS_MOVE_CANCEL_PX) {
      cancelLongPress()
    }
  }

  return (
    <div
      ref={wrapRef}
      className={cn('group/react w-full', className)}
      onTouchStart={canReact ? onTouchStart : undefined}
      onTouchMove={canReact ? onTouchMove : undefined}
      onTouchEnd={canReact ? cancelLongPress : undefined}
      onTouchCancel={canReact ? cancelLongPress : undefined}
    >
      <div className='relative w-fit'>
        {children}
        {canReact && (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation()
              openFrom(buttonRef.current)
            }}
            className={cn(
              'bg-secondary border-tertiary text-neutral hover:text-foreground absolute top-1/2 hidden h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border opacity-0 transition-opacity group-hover/react:opacity-100 md:flex',
              buttonSide === 'right' ? 'left-full ml-1.5' : 'right-full mr-1.5',
              anchorRect && 'opacity-100'
            )}
            aria-label='Add reaction'
          >
            <svg
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              className='h-4 w-4'
            >
              <circle cx='10.5' cy='12.5' r='8' />
              <path d='M7.5 14.5a4 4 0 0 0 6 0' />
              <line x1='8' y1='10.5' x2='8.01' y2='10.5' />
              <line x1='13' y1='10.5' x2='13.01' y2='10.5' />
              <line x1='19.5' y1='2.5' x2='19.5' y2='8.5' />
              <line x1='16.5' y1='5.5' x2='22.5' y2='5.5' />
            </svg>
          </button>
        )}
        {anchorRect && (
          <EmojiPickerPopover anchorRect={anchorRect} onPick={onPick} onClose={() => setAnchorRect(null)} />
        )}
      </div>
    </div>
  )
}

export default ReactionHoverZone
