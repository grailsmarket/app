import React from 'react'
import { cn } from '@/utils/tailwind'

interface AssetSummaryProps {
  name: string
  /** The name image, usually a NameImage filling its box. */
  image?: React.ReactNode
  meta?: React.ReactNode
  price?: React.ReactNode
  priceSub?: React.ReactNode
  badge?: React.ReactNode
  /** Smaller variant for steps where a transaction is in flight. */
  compact?: boolean
  /** Several names: up to three images drawn as a stack, the first in front. Replaces `image`. */
  stack?: React.ReactNode[]
  className?: string
}

const STACK_DEPTH_CLASS_NAMES = [
  'left-0 z-30',
  'left-2 z-20 scale-[0.92] opacity-80',
  'left-4 z-10 scale-[0.84] opacity-55',
]

const AssetSummary: React.FC<AssetSummaryProps> = ({
  name,
  image,
  meta,
  price,
  priceSub,
  badge,
  compact,
  stack,
  className,
}) => {
  const tileSize = compact ? 'h-10 w-10' : 'h-12 w-12'

  return (
    <div
      className={cn(
        'bg-secondary flex shrink-0 items-center gap-2 rounded-lg p-3 transition-[padding] duration-300 ease-out',
        compact && 'py-2 pl-2',
        className
      )}
    >
      {stack ? (
        <div aria-hidden='true' className={cn('relative shrink-0', compact ? 'h-10 w-14' : 'h-12 w-16')}>
          {stack.slice(0, 3).map((tile, depth) => (
            <div
              key={depth}
              className={cn(
                'bg-tertiary ring-secondary absolute top-0 overflow-hidden rounded-md ring-2 transition-[width,height] duration-300 ease-out',
                tileSize,
                stack.length > 1 && STACK_DEPTH_CLASS_NAMES[depth]
              )}
            >
              {tile}
            </div>
          ))}
        </div>
      ) : (
        <div
          aria-hidden='true'
          className={cn(
            'bg-tertiary relative shrink-0 overflow-hidden rounded-md transition-[width,height] duration-300 ease-out',
            tileSize
          )}
        >
          {image}
        </div>
      )}
      <div className='flex min-w-0 flex-1 flex-col gap-0.5'>
        <div className='flex min-w-0 items-center gap-1.5'>
          <p className='truncate text-xl font-bold'>{name}</p>
          {badge}
        </div>
        {meta && <p className='text-neutral text-md truncate'>{meta}</p>}
      </div>
      {price && (
        <div className='flex shrink-0 flex-col items-end gap-0.5 text-right tabular-nums'>
          {price}
          {priceSub && <p className='text-neutral text-md'>{priceSub}</p>}
        </div>
      )}
    </div>
  )
}

export default AssetSummary
