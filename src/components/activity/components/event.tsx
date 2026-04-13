import React from 'react'
import { ProfileActivityEventType } from '@/types/profile'
import Image from 'next/image'
import Mint from 'public/icons/mint.svg'
import Transfer from 'public/icons/transfer.svg'
import Cancelled from 'public/icons/cancelled.svg'
import OfferMade from 'public/icons/bid.svg'
import Sold from 'public/icons/sold.svg'
import Listed from 'public/icons/listed.svg'
import Renewal from 'public/icons/renewal.svg'
import OpenSea from 'public/logos/opensea.svg'
import Grails from 'public/logo.svg'
import Vision from 'public/logos/vision.svg'
import SnipeZone from 'public/logos/snipezone.png'
import ENSTools from 'public/logos/enstools.png'
import ETHGray from 'public/icons/eth-gray.svg'
import formatTimeAgo from '@/utils/time/formatTimeAgo'
import { formatDuration } from '@/utils/time/formatDuration'

interface EventProps {
  event: ProfileActivityEventType
  platform: string
  timestamp: string
  duration?: number
}

const Event: React.FC<EventProps> = ({ event, platform, timestamp, duration }) => {
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
    renewal: Renewal,
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
    renewal: 'Extended',
  }[event]

  const platformIcon = {
    opensea: OpenSea,
    grails: Grails,
    vision: Vision,
    snipezone: SnipeZone,
    enstools: ENSTools,
  }[platform as 'opensea' | 'grails' | 'vision' | 'snipezone' | 'enstools']

  return (
    <div className='flex w-full flex-row items-center gap-1.5 sm:gap-2'>
      <div className='flex h-7 w-7 items-center justify-center'>
        <Image
          src={platformIcon || ETHGray}
          alt='Opensea'
          width={platformIcon ? 32 : 24}
          height={platformIcon ? 32 : 24}
          className='h-auto w-7'
        />
      </div>
      <div className='flex flex-col items-start'>
        <div className='flex items-center gap-1'>
          {icon && <Image src={icon} alt={event} width={15} height={15} className='h-3 w-3 sm:h-4 sm:w-4' />}
          <p>
            <span className='text-md font-semibold capitalize sm:text-lg'>{eventName}</span>
            <span className='sm:text-md text-neutral mt-px text-sm font-medium'>
              {duration ? ` (${formatDuration(duration)})` : ''}
            </span>
          </p>
        </div>
        <p className='sm:text-md text-neutral mt-px text-sm font-medium'>{formatTimeAgo(timestamp)}</p>
      </div>
    </div>
  )
}

export default Event
