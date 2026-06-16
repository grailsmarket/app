'use client'

import React from 'react'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { formatAddress } from '@/utils/formatAddress'
import { cn } from '@/utils/tailwind'
import type { ReplyPreview as ReplyPreviewData } from '@/types/chat'

interface Props {
  replyTo: ReplyPreviewData
  className?: string
}

/**
 * Compact quoted preview of the parent message, shown above a reply's body.
 * Resolves the parent author's display name the same way the main sender label
 * does (usePeerProfile → ENS, fallback to a short address).
 */
const ReplyPreview: React.FC<Props> = ({ replyTo, className }) => {
  const profile = usePeerProfile(replyTo.sender_address as `0x${string}` | undefined)
  const label = profile?.displayLabel ?? (replyTo.sender_address ? formatAddress(replyTo.sender_address) : 'Unknown')

  return (
    <div className={cn('border-primary/50 mb-1 flex flex-col gap-0.5 border-l-2 pl-2 text-sm', className)}>
      <span className='text-primary font-semibold'>{label}</span>
      <span className='text-neutral line-clamp-1 italic'>{replyTo.deleted ? 'Deleted message' : replyTo.body}</span>
    </div>
  )
}

export default ReplyPreview
