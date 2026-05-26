'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import CategoryMultiSelect from './categoryMultiSelect'
import Image from 'next/image'
import { isAddress } from 'viem'
import { truncateAddress } from 'ethereum-identity-kit'
import { getMetadataAssetUrl } from '@/utils/web3/ens'

interface FeedFiltersProps {
  ownerInput: string
  onOwnerInputChange: (value: string) => void
  ownerName?: string | null
  oppositeIdentifier?: string | null
  ownerError: string | null
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
  ownerPlaceholder?: string
  compact?: boolean
}

const FeedFilters: React.FC<FeedFiltersProps> = ({
  ownerInput,
  onOwnerInputChange,
  ownerName,
  oppositeIdentifier,
  ownerError,
  selectedClubs,
  onSelectedClubsChange,
  ownerPlaceholder = 'Filter owner by ENS or address',
  compact,
}) => {
  return (
    <div className='border-tertiary border-b-2'>
      <div className={cn('mx-auto flex max-w-5xl gap-2 px-3 py-3 sm:px-5', compact && 'px-2 py-2 sm:px-2')}>
        <div
          className={cn('flex gap-2 sm:items-center sm:justify-between', compact ? 'w-full flex-col' : 'flex-nowrap')}
        >
          <div className={cn('flex gap-2 sm:flex-row sm:items-center', compact && 'w-full flex-col')}>
            <CategoryMultiSelect
              selectedClubs={selectedClubs}
              onSelectedClubsChange={onSelectedClubsChange}
              compact={compact}
            />
            <div className={cn('relative', compact && 'w-full')}>
              <input
                value={ownerInput}
                onChange={(e) => onOwnerInputChange(e.target.value)}
                placeholder={ownerPlaceholder}
                className={cn(
                  'border-tertiary placeholder:text-neutral focus:border-foreground/50 h-10 w-full rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none',
                  compact ? 'text-sm' : 'text-md sm:w-[300px]'
                )}
              />
            </div>
            {oppositeIdentifier && (
              <div className={cn('px-md items-center gap-1.5 md:px-0', compact ? 'flex px-0' : 'hidden md:flex')}>
                {ownerName && (
                  <Image
                    src={getMetadataAssetUrl(ownerName, 'avatar')}
                    alt={ownerName ?? ''}
                    width={26}
                    height={26}
                    className='h-5 w-5 rounded-full md:h-6.5 md:w-6.5'
                  />
                )}
                <p
                  className={cn(
                    'font-medium',
                    compact ? 'text-sm' : 'text-md md:text-lg',
                    ownerError && 'text-red-400'
                  )}
                >
                  {isAddress(oppositeIdentifier) ? truncateAddress(oppositeIdentifier) : ownerName || ownerError}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedFilters
