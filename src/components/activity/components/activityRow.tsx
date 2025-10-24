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
import { formatPrice } from '@/utils/formatPrice'
import { truncateAddress } from 'ethereum-identity-kit'
import { formatDate } from '@/utils/time/formatDate'

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

  const columnWidth = `${100 / displayedColumns.length}%`

  return (
    <div className='group bg-background hover:bg-secondary md:p-md lg:p-lg flex h-[60px] w-full cursor-pointer flex-row items-center justify-start rounded-sm transition'>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        {icon && <Image src={icon} alt={activity.event_type} width={26} height={26} />}
        <div>
          <p className='text-lg font-medium capitalize'>{activity.event_type}</p>
        </div>
      </div>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        <p>{activity.price ? formatPrice(activity.price) : 'N/A'}</p>
      </div>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        <p>{activity.actor_address ? truncateAddress(activity.actor_address) : 'N/A'}</p>
      </div>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        <p>{activity.counterparty_address ? truncateAddress(activity.counterparty_address) : 'N/A'}</p>
      </div>
      <div className='flex flex-row items-center gap-2' style={{ width: columnWidth }}>
        <p>{activity.created_at ? formatDate(new Date(activity.created_at).getTime()) : 'N/A'}</p>
      </div>
    </div>
  )
}

export default ActivityRow
