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
}) => {
  return (
    <div className='border-tertiary border-b-2'>
      <div className='mx-auto flex max-w-5xl gap-2 px-3 py-3 sm:px-5'>
        <div className='flex flex-nowrap gap-2 sm:items-center sm:justify-between'>
          <div className='flex gap-2 sm:flex-row sm:items-center'>
            <CategoryMultiSelect selectedClubs={selectedClubs} onSelectedClubsChange={onSelectedClubsChange} />
            <div className='relative'>
              <input
                value={ownerInput}
                onChange={(e) => onOwnerInputChange(e.target.value)}
                placeholder={ownerPlaceholder}
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
