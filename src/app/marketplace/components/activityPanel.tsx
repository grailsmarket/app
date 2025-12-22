'use client'

import React from 'react'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useWindowSize } from 'ethereum-identity-kit'
import { useMarketplaceActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import useScrollToBottom from '@/hooks/useScrollToBottom'

const ActivityPanel: React.FC = () => {
  const dispatch = useAppDispatch()
  const { actions } = useFilterRouter()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity, isConnected } = useMarketplaceActivity()
  const isAtBottom = useScrollToBottom({ threshold: 100 })
  const { width: windowWidth } = useWindowSize()

  return (
    <div className='px-md pt-md md:pt-lg flex w-full flex-col gap-2'>
      <div className='md:px-md lg:px-lg flex w-full items-center justify-between gap-2 lg:hidden'>
        <div className='flex w-full items-center justify-between gap-2'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 md:h-10 md:w-10 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='flex items-center justify-end gap-1 sm:gap-2'>
            <div
              className={`h-2.5 w-2.5 animate-pulse rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className='text-md text-right font-medium sm:text-lg'>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
      <Activity
        maxHeight={
          windowWidth && windowWidth > 1024
            ? 'calc(100dvh - 128px)'
            : windowWidth && windowWidth > 768
              ? 'calc(100dvh - 172px)'
              : 'calc(100dvh - 140px)'
        }
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        columns={['event', 'name', 'price', 'from', 'to']}
        scrollEnabled={isAtBottom}
      />
    </div>
  )
}

export default ActivityPanel
