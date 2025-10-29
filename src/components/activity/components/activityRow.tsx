import React from 'react'
import { ProfileActivityType } from '@/types/profile'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import Event from './event'
import Name from './name'
import Price from './price'
import User from '@/components/ui/user'
import { cn } from '@/utils/tailwind'
import { ActivityColumnType } from '@/types/domains'

interface ActivityRowProps {
  activity: ProfileActivityType
  displayedColumns: ActivityColumnType[]
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, displayedColumns }) => {
  const addressToShow = activity.counterparty_address || activity.actor_address
  const columnWidth = `${100 / displayedColumns.length}%`
  const columns = {
    event: <Event event={activity.event_type} />,
    name: <Name name={activity.name} tokenId={activity.token_id} />,
    price: <Price price={activity.price_wei} currencyAddress={activity.currency_address} />,
    counterparty: addressToShow && <User address={addressToShow} />,
    from: activity.actor_address && <User address={activity.actor_address} />,
    to: activity.counterparty_address && <User address={activity.counterparty_address} />,
    timestamp: activity.created_at ? formatExpiryDate(activity.created_at) : 'N/A',
  }

  return (
    <div className='group md:p-md lg:p-lg flex h-[60px] w-full flex-row items-center justify-start gap-1 rounded-sm bg-transparent transition hover:bg-white/10'>
      {displayedColumns.map((column, index) => (
        <div
          key={column}
          className={cn('flex flex-row items-center gap-2', index + 1 === displayedColumns.length && 'justify-end')}
          style={{ width: columnWidth }}
        >
          {columns[column]}
        </div>
      ))}
    </div>
  )
}

export default ActivityRow
