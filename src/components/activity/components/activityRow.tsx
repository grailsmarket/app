import { Address } from 'viem'
import React, { useMemo } from 'react'
import Name from './name'
import Event from './event'
import Price from './price'
import { cn } from '@/utils/tailwind'
import User from '@/components/ui/user'
import { ActivityColumnType } from '@/types/domains'
import { ActivityType } from '@/types/profile'
import ActivityTime from '@/components/ui/activityTime'

interface ActivityRowProps {
  activity: ActivityType
  displayedColumns: ActivityColumnType[]
  displayedAddress?: Address
  index: number
}

const ActivityRow: React.FC<ActivityRowProps> = ({ activity, displayedColumns, displayedAddress, index }) => {
  const addressToShow = useMemo(() => {
    if (displayedAddress) {
      if (activity.actor_address === displayedAddress) {
        return activity.counterparty_address
      } else {
        return activity.actor_address
      }
    }

    return activity.actor_address || activity.counterparty_address
  }, [activity.counterparty_address, activity.actor_address, displayedAddress])

  const basecolWidthReduction =
    (displayedColumns.includes('event') ? 10 : 0) +
    (displayedColumns.includes('name') || displayedColumns.includes('user') ? 10 : 0)
  const baseColWidth = (100 - basecolWidthReduction) / displayedColumns.length
  const columnWidth = `${baseColWidth}%`
  const nameColumnWidth = `${baseColWidth + 10}%`
  const userColumnWidth = displayedColumns.includes('name') ? `${baseColWidth}%` : `${baseColWidth + 10}%`
  const eventColumnWidth = `${baseColWidth + 10}%`

  const columns = {
    event: <Event event={activity.event_type} platform={activity.platform} timestamp={activity.created_at} />,
    name: <Name name={activity.name} tokenId={activity.token_id} />,
    price: (
      <Price
        price={activity.price_wei}
        currencyAddress={activity.currency_address}
        tooltipPosition={index === 0 ? 'bottom' : 'top'}
      />
    ),
    user: addressToShow && <User address={addressToShow} className='max-w-[95%]' />,
    from: activity.actor_address ? (
      <User address={activity.actor_address} className='max-w-[95%]' wrapperClassName='justify-start' />
    ) : null,
    to: activity.counterparty_address ? <User address={activity.counterparty_address} className='max-w-[95%]' /> : null,
    time: activity.created_at ? (
      <ActivityTime
        timestamp={activity.created_at}
        className='text-md text-light-200 font-medium'
        tooltipPosition={index === 0 ? 'bottom' : 'top'}
      />
    ) : null,
  }

  return (
    <div className='group px-md lg:px-lg border-tertiary flex h-[86px] w-full flex-row flex-wrap items-center justify-start border-b bg-transparent py-1 transition hover:bg-white/10 sm:h-[60px] sm:flex-nowrap sm:py-0'>
      {displayedColumns.map((column, index) => (
        <div
          key={column}
          className={cn('flex flex-row items-center gap-2', index + 1 === displayedColumns.length && 'justify-end')}
          style={{
            width:
              column === 'name'
                ? nameColumnWidth
                : column === 'event'
                  ? eventColumnWidth
                  : column === 'user'
                    ? userColumnWidth
                    : columnWidth,
          }}
        >
          {columns[column]}
        </div>
      ))}
      {displayedColumns.includes('name') ? (
        <div className='pr-md flex w-full flex-row justify-between sm:hidden'>
          {addressToShow && (
            <User
              address={addressToShow}
              className='max-w-[50%]'
              wrapperClassName='justify-start'
              loadingCellWidth='120px'
            />
          )}
          <Price
            price={activity.price_wei}
            currencyAddress={activity.currency_address}
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
          />
        </div>
      ) : (
        <div className='flex w-full flex-row justify-between sm:hidden'>
          {activity.actor_address && (
            <User
              address={activity.actor_address}
              className='max-w-[50%]'
              wrapperClassName='justify-start'
              loadingCellWidth='120px'
            />
          )}
          {activity.counterparty_address && (
            <User address={activity.counterparty_address} className='max-w-[50%]' loadingCellWidth='120px' />
          )}
        </div>
      )}
    </div>
  )
}

export default ActivityRow
