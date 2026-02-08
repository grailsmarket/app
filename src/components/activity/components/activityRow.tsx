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
import Image from 'next/image'
import ExternalLinkIcon from 'public/logos/etherscan.svg'
import Link from 'next/link'

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
    name: <Name name={activity.name} tokenId={activity.token_id} clubs={activity.clubs} />,
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
    <div className='group px-md lg:px-lg border-tertiary flex h-[86px] w-full max-w-full flex-row flex-wrap items-center justify-start overflow-x-hidden border-b bg-transparent py-1 transition hover:bg-white/10 sm:h-[60px] sm:flex-nowrap sm:py-0'>
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
          <div className='flex items-center gap-1 pl-4'>
            {activity.transaction_hash && (
              <Link
                href={`https://etherscan.io/tx/${activity.transaction_hash}`}
                target='_blank'
                className='cursor-pointer hover:opacity-80'
              >
                <Image
                  src={ExternalLinkIcon}
                  alt={`transaction hash ${activity.transaction_hash}`}
                  width={20}
                  height={20}
                />
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className='flex w-full flex-row justify-between sm:hidden'>
          {activity.actor_address && (
            <User
              address={activity.actor_address}
              className='max-w-full'
              wrapperClassName='justify-start w-fit'
              loadingCellWidth='120px'
            />
          )}
          {activity.counterparty_address && (
            <User
              address={activity.counterparty_address}
              className='w-fit max-w-full'
              wrapperClassName='w-full justify-end'
              loadingCellWidth='120px'
            />
          )}
          <div className='ml-2 flex min-h-5 w-5 min-w-5 items-center gap-1'>
            {activity.transaction_hash && (
              <Link
                href={`https://etherscan.io/tx/${activity.transaction_hash}`}
                target='_blank'
                className='cursor-pointer hover:opacity-80'
              >
                <Image
                  src={ExternalLinkIcon}
                  alt={`transaction hash ${activity.transaction_hash}`}
                  width={20}
                  height={20}
                />
              </Link>
            )}
          </div>
        </div>
      )}
      <div className='hidden min-h-4! max-w-6 min-w-6! items-center justify-end gap-1 sm:flex'>
        {activity.transaction_hash && (
          <Link
            href={`https://etherscan.io/tx/${activity.transaction_hash}`}
            target='_blank'
            className='cursor-pointer hover:opacity-80'
          >
            <Image
              src={ExternalLinkIcon}
              alt={`transaction hash ${activity.transaction_hash}`}
              width={20}
              height={20}
            />
          </Link>
        )}
      </div>
    </div>
  )
}

export default ActivityRow
