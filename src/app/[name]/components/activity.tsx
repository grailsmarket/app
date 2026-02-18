'use client'

import React from 'react'
import { useNameActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import { cn } from '@/utils/tailwind'

interface Props {
  name: string
}

const ActivityPanel: React.FC<Props> = ({ name }) => {
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity, isActivityEmpty } = useNameActivity(name)

  return (
    <div
      className={cn(
        'sm:border-tertiary bg-secondary pt-lg flex w-full flex-col gap-1 sm:rounded-lg sm:border-2 lg:gap-2',
        isActivityEmpty && 'pb-6'
      )}
      style={{ maxHeight: '500px', overflow: 'hidden' }}
    >
      <h2 className='px-lg xl:px-xl font-sedan-sc text-3xl'>Activity</h2>
      <div className='px-md w-full overflow-y-auto sm:px-0 z-0'>
        <Activity
          paddingBottom='0px'
          activity={activity}
          loadingRowCount={20}
          noResults={isActivityEmpty}
          noResultsLabel='No activity found for this name.'
          isLoading={activityLoading}
          hasMoreActivity={hasMoreActivity}
          fetchMoreActivity={fetchMoreActivity}
          showHeaders={true}
          columns={['event', 'price', 'from', 'to']}
          useLocalScrollTop={true}
          stickyHeaders={true}
          hideNoResultsIcon={true}
          noResultsHeight='28px'
          className='bg-secondary sticky top-0!'
        />
      </div>
    </div>
  )
}

export default ActivityPanel
