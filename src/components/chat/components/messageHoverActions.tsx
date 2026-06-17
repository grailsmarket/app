'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/tailwind'
import EmojiPickerPopover from './reactions/emojiPickerPopover'
import { LONG_PRESS_MS, LONG_PRESS_MOVE_CANCEL_PX } from './reactions/constants'
import ContextMenu, { type ContextMenuItem } from './contextMenu'
import ReplyArrowIcon from '@/app/feed/components/replyArrowIcon'
import Image from 'next/image'
import ReactionIcon from 'public/icons/reaction.svg'
import { invertAlignSide } from '@/utils/chat/formatters'

interface Props {
  canReact: boolean
  onPick: (emoji: string) => void
  canReply: boolean
  onReply: () => void
  menuItems: ContextMenuItem[]
  side: 'left' | 'right'
  position: 'top' | 'bottom'
  children: React.ReactNode
  className?: string
  isGlobal?: boolean
}

const ICON_BTN =
  'text-neutral hover:opacity-80 flex h-4 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full transition-opacity'

const MessageHoverActions: React.FC<Props> = ({
  canReact,
  onPick,
  canReply,
  onReply,
  menuItems,
  side,
  position,
  children,
  className,
  isGlobal,
}) => {
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const reactBtnRef = useRef<HTMLButtonElement>(null)
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

  // Clear a pending long-press timer on unmount so it can't fire afterwards.
  useEffect(
    () => () => {
      if (pressTimer.current) clearTimeout(pressTimer.current)
    },
    []
  )

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

  const reactItem: ContextMenuItem[] = canReact
    ? [{ label: 'React', onClick: () => openFrom(wrapRef.current), icon: ReactionIcon }]
    : []
  const allMenuItems = [...reactItem, ...menuItems]

  const hasActions = allMenuItems.length > 0
  const pinned = !!anchorRect || menuOpen

  const ChatSidebarWidth = document.getElementById('chat-sidebar-panel')?.clientWidth ?? 0
  const messageWidth = wrapRef.current?.clientWidth ?? 0
  const remainingWidth = ChatSidebarWidth - messageWidth - 24 - 36 - 14
  const isMsgFullWidth = remainingWidth < 60 // subtract sidebar padding, avatar size, and gaps

  const isSufficientMenuWidth = remainingWidth < 110
  const alignSide = isGlobal ? side : isSufficientMenuWidth ? side : invertAlignSide(side)

  const cluster = hasActions ? (
    <div
      className={cn(
        'flex w-fit flex-wrap items-center gap-1 gap-y-1.5 transition-opacity',
        'opacity-100 md:opacity-0 md:group-hover/msg:opacity-100',
        pinned && 'opacity-100',
        isMsgFullWidth ? 'flex-col' : 'flex-row',
        wrapRef.current?.clientWidth && `max-h-[${wrapRef.current?.clientHeight}px]!`
      )}
    >
      {canReply && (
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            onReply()
            document.getElementById('chat-composer-textarea')?.focus()
          }}
          className={cn(ICON_BTN, 'hidden md:flex')}
          aria-label='Reply'
        >
          <ReplyArrowIcon height={16} width={16} />
        </button>
      )}
      {canReact && (
        <button
          ref={reactBtnRef}
          type='button'
          onClick={(e) => {
            e.stopPropagation()
            openFrom(reactBtnRef.current)
          }}
          className={cn(ICON_BTN, 'hidden md:flex')}
          aria-label='Add reaction'
        >
          <Image src={ReactionIcon} alt='Reaction' width={14} height={14} />
        </button>
      )}
      <ContextMenu
        open={menuOpen}
        items={allMenuItems}
        align={alignSide}
        position={position}
        className={ICON_BTN}
        label='Message options'
        onOpenChange={setMenuOpen}
        isGlobal={isGlobal}
      />
    </div>
  ) : null

  return (
    <div className={cn('group/msg flex w-fit items-center gap-1.5', className)} onMouseLeave={() => setMenuOpen(false)}>
      {side === 'left' && cluster}
      <div
        ref={wrapRef}
        className='h-full w-fit min-w-0'
        onTouchStart={canReact ? onTouchStart : undefined}
        onTouchMove={canReact ? onTouchMove : undefined}
        onTouchEnd={canReact ? cancelLongPress : undefined}
        onTouchCancel={canReact ? cancelLongPress : undefined}
      >
        {children}
      </div>
      {side === 'right' && cluster}
      {anchorRect && <EmojiPickerPopover anchorRect={anchorRect} onPick={onPick} onClose={() => setAnchorRect(null)} />}
    </div>
  )
}

export default MessageHoverActions
