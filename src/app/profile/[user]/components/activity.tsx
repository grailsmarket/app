'use client'

import React from 'react'
import { Address } from 'ethereum-identity-kit'
import Activity from '@/components/activity'
import { useProfileActivity } from '../hooks/useActivity'

interface Props {
  user: Address | undefined
}

const ActivityPanel: React.FC<Props> = ({ user }) => {
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } = useProfileActivity(user)

  return (
    <div className='z-0 flex w-full flex-col'>
      {/* <div
        className={cn(
          'py-md md:py-lg px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='flex w-auto items-center gap-2'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
        </div>
      </div> */}
      <Activity
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        displayedAddress={user}
        stickyHeaders={true}
      />
    </div>
  )
}

export default ActivityPanel
