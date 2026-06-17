'use client'

import React from 'react'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { formatAddress } from '@/utils/formatAddress'
import { cn } from '@/utils/tailwind'
import type { ReplyPreview as ReplyPreviewData } from '@/types/chat'

interface Props {
  replyTo: ReplyPreviewData
  className?: string
  /**
   * Rendered on the caller's own (light `bg-primary`) bubble, whose body uses
   * `text-background`. The default colors (`text-primary`/`text-neutral`) wash
   * out there, so switch to the dark on-bubble color to match the body text.
   */
  onOwnBubble?: boolean
}

/**
 * Compact quoted preview of the parent message, shown above a reply's body.
 * Resolves the parent author's display name the same way the main sender label
 * does (usePeerProfile → ENS, fallback to a short address).
 */
const ReplyPreview: React.FC<Props> = ({ replyTo, className, onOwnBubble }) => {
  const profile = usePeerProfile(replyTo.sender_address as `0x${string}` | undefined)
  const label = profile?.displayLabel ?? (replyTo.sender_address ? formatAddress(replyTo.sender_address) : 'Unknown')

  return (
    <div
      className={cn(
        'mb-1 flex flex-col gap-0.5 border-l-2 pl-2 text-sm',
        onOwnBubble ? 'border-background/40' : 'border-primary/50',
        className
      )}
    >
      <span className={cn('font-semibold', onOwnBubble ? 'text-background' : 'text-primary')}>{label}</span>
      <span className={cn('line-clamp-1 italic', onOwnBubble ? 'text-background/80' : 'text-neutral')}>
        {replyTo.deleted ? 'Deleted message' : replyTo.body}
      </span>
    </div>
  )
}

export default ReplyPreview
