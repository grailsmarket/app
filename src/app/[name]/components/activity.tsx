'use client'

import React from 'react'
import { useNameActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'

interface Props {
  name: string
}

const ActivityPanel: React.FC<Props> = ({ name }) => {
  const { width } = useWindowSize()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity, isActivityEmpty } = useNameActivity(name)

  return (
    <div
      className={cn(
        'border-primary bg-secondary pt-lg lg:pt-xl flex w-full flex-col gap-1 rounded-lg border-2 lg:gap-4',
        isActivityEmpty && 'pb-6'
      )}
    >
      <h2 className='px-lg lg:px-xl font-sedan-sc text-3xl'>Activity</h2>
      <Activity
        maxHeight={width && width < 1024 ? '100%' : '520px'}
        paddingBottom='0px'
        activity={activity}
        loadingRowCount={20}
        noResults={isActivityEmpty}
        noResultsLabel='No activity found for this name.'
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        showHeaders={true}
        columns={['event', 'price', 'timestamp', 'counterparty']}
      />
    </div>
  )
}

export default ActivityPanel
