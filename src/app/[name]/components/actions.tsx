import Watchlist from '@/components/ui/watchlist'
import { MarketplaceDomainType } from '@/types/domains'
import Image from 'next/image'
import React from 'react'
import ViewIcon from 'public/icons/view.svg'
import UpvoteIcon from 'public/icons/upvote.svg'
import DownvoteIcon from 'public/icons/downvote.svg'


interface ActionsProps {
  nameDetails?: MarketplaceDomainType
}

const Actions: React.FC<ActionsProps> = ({ nameDetails }) => {
  return (
    <div className='flex flex-row gap-2 w-full justify-between'>
      <div className='flex flex-row gap-4'>
        <div className='flex flex-row items-center gap-2'>
          <Image src={ViewIcon} alt='View' width={34} height={34} className='h-7 w-7 opacity-100' />
          <p>44</p>
        </div>
        <div className='flex flex-row items-center gap-2'>
          {nameDetails && <Watchlist domain={nameDetails} tooltipPosition='bottom' iconSize={36} iconClassName='w-8 h-8 opacity-100' tooltipAlign='left' />}
          <p>44</p>
        </div>
      </div>

      <div className='flex flex-row gap-5'>
        <div className='flex flex-row items-center gap-2'>
          <button>
            <Image src={UpvoteIcon} alt='Upvote' width={24} height={24} className='h-6 w-6 opacity-100' />
          </button>
          <p>44</p>
        </div>
        <div className='flex flex-row items-center gap-2'>
          <button>
            <Image src={DownvoteIcon} alt='Downvote' width={24} height={24} className='h-6 w-6 opacity-100' />
          </button>
          <p>44</p>
        </div>
      </div>
    </div>
  )
}

export default Actions
