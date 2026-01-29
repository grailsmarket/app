'use client'

import React from 'react'
import { useMarketplaceActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'

interface ActivityPanelProps {
  isLiveActivityConnected: boolean
  setIsLiveActivityConnected: (isConnected: boolean) => void
}

const ActivityPanel: React.FC<ActivityPanelProps> = ({ setIsLiveActivityConnected }) => {
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } =
    useMarketplaceActivity(setIsLiveActivityConnected)

  return (
    <div className='z-0 flex w-full flex-col'>
      {/* <div
        className={cn(
          'py-md md:py-lg px-md transition-top lg:px-lg bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='flex w-full items-center justify-between gap-2'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='flex items-center justify-end gap-1 sm:gap-2'>
            <div
              className={`h-2.5 w-2.5 animate-pulse rounded-full ${isLiveActivityConnected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className='text-md text-right font-medium sm:text-lg'>
              {isLiveActivityConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div> */}
      <Activity
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        columns={['event', 'name', 'price', 'from', 'to']}
      />
    </div>
  )
}

export default ActivityPanel
