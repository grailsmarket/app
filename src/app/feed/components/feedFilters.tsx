'use client'

import React from 'react'
import { cn } from '@/utils/tailwind'
import CategoryMultiSelect from './categoryMultiSelect'
import Image from 'next/image'
import { ENS_METADATA_URL } from '@/constants/ens'
import { isAddress } from 'viem'
import { truncateAddress } from 'ethereum-identity-kit'

interface FeedFiltersProps {
  ownerInput: string
  onOwnerInputChange: (value: string) => void
  ownerName?: string | null
  oppositeIdentifier?: string | null
  ownerError: string | null
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
}

const FeedFilters: React.FC<FeedFiltersProps> = ({
  ownerInput,
  onOwnerInputChange,
  ownerName,
  oppositeIdentifier,
  ownerError,
  selectedClubs,
  onSelectedClubsChange,
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
                placeholder='Filter owner by ENS or address'
                className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-full rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none sm:w-[300px]'
              />
            </div>
            {oppositeIdentifier && (
              <div className='px-md hidden items-center gap-1.5 md:flex md:px-0'>
                <Image
                  src={`${ENS_METADATA_URL}/mainnet/avatar/${ownerName}`}
                  alt={ownerName ?? ''}
                  width={26}
                  height={26}
                  className='h-5 w-5 rounded-full md:h-6.5 md:w-6.5'
                />
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
