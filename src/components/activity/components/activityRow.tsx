import React from 'react'
import { ProfileActivityType } from '@/types/profile'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import Event from './event'
import Name from './name'
import Price from './price'
import User from '@/components/ui/user'
import { cn } from '@/utils/tailwind'

interface ActivityRowProps {
  activity: ProfileActivityType
  displayedColumns: string[]
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, displayedColumns }) => {
  const addressToShow = activity.counterparty_address || activity.actor_address
  const columnWidth = `${100 / displayedColumns.length}%`
  const columns = {
    event: <Event event={activity.event_type} />,
    name: <Name name={activity.name} tokenId={activity.token_id} />,
    price: <Price price={activity.price_wei} currencyAddress={activity.currency_address} />,
    counterparty: addressToShow && <User address={addressToShow} />,
    timestamp: activity.created_at ? formatExpiryDate(activity.created_at) : 'N/A',
  }

  return (
    <div className='group bg-transparent hover:bg-white/10 gap-1 md:p-md lg:p-lg flex h-[60px] w-full flex-row items-center justify-start rounded-sm transition'>
      {Object.entries(columns).map(([key, value], index) => (
        <div key={key} className={cn('flex flex-row items-center gap-2', (index + 1) === displayedColumns.length && 'justify-end')} style={{ width: columnWidth }}>
          {value}
        </div>
      ))}
    </div>
  )
}

export default ActivityRow
