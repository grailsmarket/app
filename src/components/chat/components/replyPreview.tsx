'use client'

import React from 'react'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { formatAddress } from '@/utils/formatAddress'
import { cn } from '@/utils/tailwind'
import type { ReplyPreview as ReplyPreviewData } from '@/types/chat'

interface Props {
  replyTo: ReplyPreviewData
  className?: string
  onOwnBubble?: boolean
}

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
