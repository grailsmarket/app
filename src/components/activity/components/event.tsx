import React from 'react'
import { ProfileActivityEventType } from '@/types/profile'
import Image from 'next/image'
import Mint from 'public/icons/mint.svg'
import Transfer from 'public/icons/transfer.svg'
import Cancelled from 'public/icons/cancelled.svg'
import OfferMade from 'public/icons/bid.svg'
import Sold from 'public/icons/sold.svg'
import Listed from 'public/icons/listed.svg'
import OpenSea from 'public/logos/opensea.svg'
import Grails from 'public/logo.png'
import ETHGray from 'public/icons/eth-gray.svg'
import formatTimeAgo from '@/utils/time/formatTimeAgo'

interface EventProps {
  event: ProfileActivityEventType
  platform: string
  timestamp: string
}

const Event: React.FC<EventProps> = ({ event, platform, timestamp }) => {
  const icon = {
    listed: Listed,
    offer_made: OfferMade,
    bought: Transfer,
    sold: Sold,
    offer_accepted: Transfer,
    offer_cancelled: Cancelled,
    listing_cancelled: Cancelled,
    mint: Mint,
    sent: Transfer,
    received: Transfer,
    registration: Mint,
    sale: Sold,
    transfer: Transfer,
  }[event]

  const eventName = {
    listed: 'Listed',
    offer_made: 'Offer',
    bought: 'Bought',
    sold: 'Sold',
    offer_accepted: 'Offer Accepted',
    offer_cancelled: 'Offer Cancelled',
    listing_cancelled: 'Listing Cancelled',
    mint: 'Minted',
    sent: 'Sent',
    received: 'Received',
  }[event]

  const platformIcon = {
    opensea: OpenSea,
    grails: Grails,
  }[platform as 'opensea' | 'grails']

  return (
    <div className='flex w-full flex-row items-center gap-2'>
      <div className='flex h-8 w-8 items-center justify-center'>
        <Image
          src={platformIcon || ETHGray}
          alt='Opensea'
          width={platformIcon ? 32 : 24}
          height={platformIcon ? 32 : 24}
        />
      </div>
      <div className='flex flex-col items-start'>
        <div className='flex items-center gap-1'>
          {icon && <Image src={icon} alt={event} width={15} height={15} />}
          <p className='text-lg font-semibold capitalize'>{eventName}</p>
        </div>
        <p className='text-md text-neutral mt-px font-medium'>{formatTimeAgo(timestamp)}</p>
      </div>
    </div>
  )
}

export default Event
