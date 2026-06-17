'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import LoadingCell from '@/components/ui/loadingCell'

interface Props {
  isOwn?: boolean
  width?: string
  className?: string
}

const MessageRowSkeleton: React.FC<Props> = ({ isOwn = false, width = '45%', className }) => {
  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start', className)}>
      <div className={cn('flex w-full flex-col gap-1', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'bg-secondary flex h-11 max-w-[80%] items-center rounded-2xl px-4 py-2',
            isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'
          )}
          style={{ width }}
        >
          <LoadingCell height='16px' width='100%' />
        </div>
        <LoadingCell height='12px' width='56px' />
      </div>
    </div>
  )
}

export default MessageRowSkeleton
