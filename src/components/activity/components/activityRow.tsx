import React from 'react'
import { ProfileActivityType } from '@/types/profile'
import Image from 'next/image'
import Mint from 'public/icons/mint.svg'
import Burn from 'public/icons/burn.svg'
import Transfer from 'public/icons/transfer.svg'
// import Cancelled from 'public/icons/cancelled.svg'
// import OfferMade from 'public/icons/offer-made.svg'
import Sold from 'public/icons/sold.svg'
import Listed from 'public/icons/listed.svg'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import ethGray from 'public/icons/eth-gray.svg'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import User from '@/components/ui/user'
import { cn } from '@/utils/tailwind'
interface ActivityRowProps {
  activity: ProfileActivityType
  displayedColumns: string[]
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, displayedColumns }) => {
  const icon = {
    listed: Listed,
    offer_made: Transfer,
    bought: Transfer,
    sold: Sold,
    offer_accepted: Transfer,
    cancelled: Transfer,
    mint: Mint,
    burn: Burn,
    sent: Transfer,
    received: Transfer,
  }[activity.event_type]

  const eventName = {
    listed: 'Listed',
    offer_made: 'Offer Made',
    bought: 'Bought',
    sold: 'Sold',
    offer_accepted: 'Offer Accepted',
    cancelled: 'Cancelled',
    mint: 'Minted',
    burn: 'Burned',
    sent: 'Sent',
    received: 'Received',
  }[activity.event_type]

  const columnWidth = `${100 / displayedColumns.length}%`

  return (
    <div className='group bg-transparent hover:bg-white/10 gap-1 md:p-md lg:p-lg flex h-[60px] w-full cursor-pointer flex-row items-center justify-start rounded-sm transition'>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        {icon && <Image src={icon} alt={activity.event_type} width={26} height={26} />}
        <div>
          <p className='text-lg font-medium capitalize'>{eventName}</p>
        </div>
      </div>
      <div className='flex flex-row items-center gap-1' style={{ width: columnWidth }}>
        <Image src={ethGray} alt='ETH' className={cn('h-[14px] w-auto', activity.price_wei ? 'opacity-100' : 'opacity-0')} />
        <p>{activity.price_wei ? formatEtherPrice(activity.price_wei, false, 3) : null}</p>
      </div>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        {activity.actor_address ? <User address={activity.actor_address as `0x${string}`} /> : null}
      </div>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        {activity.counterparty_address ? <User address={activity.counterparty_address as `0x${string}`} /> : null}
      </div>
      <div className='flex flex-row items-center justify-end gap-2' style={{ width: columnWidth }}>
        <p>{activity.created_at ? formatExpiryDate(activity.created_at) : 'N/A'}</p>
      </div>
    </div>
  )
}

export default ActivityRow
