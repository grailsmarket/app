import React from 'react'
import { ProfileActivityEventType } from '@/types/profile'
import Image from 'next/image'
import Mint from 'public/icons/mint.svg'
import Transfer from 'public/icons/transfer.svg'
import Cancelled from 'public/icons/cancelled.svg'
import OfferMade from 'public/icons/bid.svg'
import Sold from 'public/icons/sold.svg'
import Listed from 'public/icons/listed.svg'

interface EventProps {
  event: ProfileActivityEventType
}

const Event: React.FC<EventProps> = ({ event }) => {
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
    offer_made: 'Offer Made',
    bought: 'Bought',
    sold: 'Sold',
    offer_accepted: 'Offer Accepted',
    offer_cancelled: 'Offer Cancelled',
    listing_cancelled: 'Listing Cancelled',
    mint: 'Minted',
    sent: 'Sent',
    received: 'Received',
  }[event]

  return (
    <div className='flex w-full flex-row items-center gap-2'>
      {icon && <Image src={icon} alt={event} width={20} height={20} />}
      <div>
        <p className='text-lg font-medium capitalize'>{eventName}</p>
      </div>
    </div>
  )
}

export default Event
