'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { useMessageReactors } from '@/hooks/chat/useMessageReactors'
import { formatAddress } from '@/utils/formatAddress'

const POPOVER_WIDTH = 240 // w-60
const MAX_HEIGHT = 280 // max-h-70

interface Props {
  chatId: string
  messageId: string
  /** Which reaction's reactors to show (one pill = one emoji). */
  emoji: string
  /** Viewport rect of the pill, captured at open time. */
  anchorRect: DOMRect
  onClose: () => void
  /** Hover-bridge handlers so the popover stays open while the cursor is over it. */
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

/** One reactor row — resolves the address to an ENS name/avatar, links to profile. */
const ReactorRow: React.FC<{ address: string; onNavigate: () => void }> = ({ address, onNavigate }) => {
  const profile = usePeerProfile(address as `0x${string}`)
  const label = profile?.displayLabel ?? formatAddress(address)
  return (
    <Link
      href={`/profile/${address}`}
      onClick={onNavigate}
      className='hover:bg-primary/10 flex items-center gap-2 rounded p-1 transition-colors'
    >
      <Avatar
        address={address as `0x${string}`}
        src={profile?.avatar ?? undefined}
        name={profile?.ensName ?? undefined}
        style={{ width: '24px', height: '24px' }}
      />
      <span className='text-foreground truncate text-sm'>{label}</span>
    </Link>
  )
}

/**
 * Fixed-position popover listing who reacted with a given emoji. Fixed (not
 * absolute) so it isn't clipped by the messages scroll container — same approach
 * as EmojiPickerPopover. Closes on outside click and Escape.
 */
const ReactorsPopover: React.FC<Props> = ({
  chatId,
  messageId,
  emoji,
  anchorRect,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) => {
  const ref = useClickAway<HTMLDivElement>(onClose)
  const { data, isLoading } = useMessageReactors(chatId, messageId, true)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const users = data?.find((r) => r.emoji === emoji)?.users ?? []

  const placeAbove = anchorRect.top > MAX_HEIGHT + 16
  const style: React.CSSProperties = {
    position: 'fixed',
    zIndex: 110, // above the chat sidebar (z-91)
    left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - POPOVER_WIDTH - 8)),
    ...(placeAbove
      ? { bottom: window.innerHeight - anchorRect.top + 6 }
      : { top: Math.min(anchorRect.bottom + 6, window.innerHeight - MAX_HEIGHT - 8) }),
  }

  return (
    <div
      ref={ref}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => e.stopPropagation()}
      className='bg-secondary border-tertiary max-h-70 w-60 overflow-y-auto rounded-md border-2 p-2 shadow-lg'
    >
      <div className='text-neutral mb-1 flex items-center gap-1 px-1 text-sm'>
        <span className='text-md leading-none'>{emoji}</span>
        <span className='font-semibold'>{users.length || ''}</span>
        <span>reacted</span>
      </div>
      {isLoading && users.length === 0 ? (
        <p className='text-neutral px-1 py-1 text-sm'>Loading…</p>
      ) : users.length === 0 ? (
        <p className='text-neutral px-1 py-1 text-sm'>No one yet</p>
      ) : (
        users.map((u) => <ReactorRow key={u.address} address={u.address} onNavigate={onClose} />)
      )}
    </div>
  )
}

export default ReactorsPopover
