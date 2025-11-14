'use client'

import Watchlist from '@/components/ui/watchlist'
import { MarketplaceDomainType } from '@/types/domains'
import Image from 'next/image'
import React, { useMemo } from 'react'
import ViewIcon from 'public/icons/view.svg'
import { useWindowSize } from 'ethereum-identity-kit'
// import UpvoteIcon from 'public/icons/upvote.svg'
// import DownvoteIcon from 'public/icons/downvote.svg'

interface ActionsProps {
  nameDetails?: MarketplaceDomainType
}

const Actions: React.FC<ActionsProps> = ({ nameDetails }) => {
  const { width } = useWindowSize()
  const tooltipAlign = useMemo(() => (width && width < 640 ? 'right' : 'left'), [width])
  const dropdownPosition = useMemo(() => (width && width < 640 ? 'left' : 'right'), [width])

  return (
    <div className='flex w-full flex-row justify-between gap-2'>
      <div className='flex w-full flex-row justify-between gap-4 sm:justify-start md:w-fit'>
        <div className='flex flex-row items-center gap-2'>
          <Image src={ViewIcon} alt='View' width={34} height={34} className='h-7 w-7 opacity-100' />
          <p>{nameDetails?.view_count}</p>
        </div>
        <div className='flex flex-row items-center gap-2'>
          {nameDetails && (
            <Watchlist
              domain={nameDetails}
              includeCount={true}
              tooltipPosition='bottom'
              iconSize={36}
              iconClassName='w-8 h-8 opacity-100'
              showSettings={true}
              dropdownPosition={dropdownPosition}
              tooltipAlign={tooltipAlign}
            />
          )}
        </div>
      </div>

      {/* <div className='flex flex-row gap-5'>
        <div className='flex flex-row items-center gap-2'>
          <button>
            <Image src={UpvoteIcon} alt='Upvote' width={24} height={24} className='h-6 w-6 opacity-100' />
          </button>
          <p>{nameDetails?.upvotes}</p>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <button>
            <Image src={DownvoteIcon} alt='Downvote' width={24} height={24} className='h-6 w-6 opacity-100' />
          </button>
          <p>{nameDetails?.downvotes}</p>
        </div>
      </div> */}
    </div>
  )
}

export default Actions
