import { Address } from 'viem'
import React, { useMemo } from 'react'
import Name from './name'
import Event from './event'
import Price from './price'
import { cn } from '@/utils/tailwind'
import User from '@/components/ui/user'
import { ActivityColumnType } from '@/types/domains'
import { ProfileActivityType } from '@/types/profile'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'

interface ActivityRowProps {
  activity: ProfileActivityType
  displayedColumns: ActivityColumnType[]
  displayedAddress?: Address
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, displayedColumns, displayedAddress }) => {
  const addressToShow = useMemo(() => {
    if (displayedAddress) {
      if (activity.counterparty_address === displayedAddress) {
        return activity.actor_address
      } else {
        return activity.counterparty_address
      }
    }

    return activity.counterparty_address || activity.actor_address
  }, [activity.counterparty_address, activity.actor_address, displayedAddress])

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
    <div className='group px-md md:px-md lg:px-lg flex h-[60px] w-full flex-row items-center justify-start gap-1 rounded-sm bg-transparent transition hover:bg-white/10'>
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
