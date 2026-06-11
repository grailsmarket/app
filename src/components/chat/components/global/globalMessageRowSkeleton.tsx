'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import LoadingCell from '@/components/ui/loadingCell'

interface Props {
  showHeader?: boolean
  bodyWidth?: string
  className?: string
}

const GlobalMessageRowSkeleton: React.FC<Props> = ({ showHeader = true, bodyWidth = '60%', className }) => {
  return (
    <div className={cn('flex w-full gap-2', showHeader ? 'mt-1' : 'mt-0', className)}>
      {/* Avatar gutter — kept for alignment even when the header is hidden */}
      <div className='flex w-full max-w-full gap-2'>
        <div className='w-9 shrink-0'>{showHeader && <LoadingCell height='36px' width='36px' radius='18px' />}</div>
        <div className='flex min-w-0 flex-1 flex-col items-start gap-1'>
          <div className='bg-secondary p-md flex max-w-[90%] flex-col gap-0.5 rounded-md' style={{ width: bodyWidth }}>
            {showHeader && (
              <div className='flex h-7 items-center gap-2'>
                <LoadingCell height='16px' width='96px' />
                <LoadingCell height='12px' width='40px' />
              </div>
            )}
            <div className='flex h-7 w-full items-center'>
              <LoadingCell height='16px' width='100%' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalMessageRowSkeleton
