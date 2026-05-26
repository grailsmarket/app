'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import CategoryMultiSelect from './categoryMultiSelect'
import Image from 'next/image'
import { isAddress } from 'viem'
import { truncateAddress } from 'ethereum-identity-kit'
import { getMetadataAssetUrl } from '@/utils/web3/ens'
import FilterIcon from 'public/icons/filter.svg'

interface FeedFiltersProps {
  ownerInput: string
  onOwnerInputChange: (value: string) => void
  ownerName?: string | null
  oppositeIdentifier?: string | null
  ownerError: string | null
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
  selectedActivityTypeCount: number
  onToggleActivityFilters: () => void
}

const FeedFilters: React.FC<FeedFiltersProps> = ({
  ownerInput,
  onOwnerInputChange,
  ownerName,
  oppositeIdentifier,
  ownerError,
  selectedClubs,
  onSelectedClubsChange,
  selectedActivityTypeCount,
  onToggleActivityFilters,
}) => {
  return (
    <div className='border-tertiary border-b-2'>
      <div className='mx-auto flex max-w-5xl gap-2 px-3 py-3 sm:px-5'>
        <div className='flex flex-nowrap gap-2 sm:items-center sm:justify-between'>
          <div className='flex gap-2 sm:flex-row sm:items-center'>
            <button
              type='button'
              onClick={onToggleActivityFilters}
              className='border-foreground relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm border opacity-80 transition-opacity hover:opacity-100'
              aria-label='Toggle activity filters'
            >
              <Image src={FilterIcon} alt='Filter' width={16} height={16} />
              {selectedActivityTypeCount > 0 && (
                <span className='bg-primary text-background absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold'>
                  {selectedActivityTypeCount}
                </span>
              )}
            </button>
            <CategoryMultiSelect selectedClubs={selectedClubs} onSelectedClubsChange={onSelectedClubsChange} />
            <div className='relative'>
              <input
                value={ownerInput}
                onChange={(e) => onOwnerInputChange(e.target.value)}
                placeholder='Filter owner by ENS or address'
                className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-full rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none sm:w-[300px]'
              />
            </div>
            {oppositeIdentifier && (
              <div className='px-md hidden items-center gap-1.5 md:flex md:px-0'>
                {ownerName && (
                  <Image
                    src={getMetadataAssetUrl(ownerName, 'avatar')}
                    alt={ownerName ?? ''}
                    width={26}
                    height={26}
                    className='h-5 w-5 rounded-full md:h-6.5 md:w-6.5'
                  />
                )}
                <p className={cn('text-md font-medium md:text-lg', ownerError && 'text-red-400')}>
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
