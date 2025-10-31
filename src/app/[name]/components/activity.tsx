'use client'

import React from 'react'
import { useNameActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import { useWindowSize } from 'ethereum-identity-kit'

interface Props {
  name: string
}

const ActivityPanel: React.FC<Props> = ({ name }) => {
  const { width } = useWindowSize()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } = useNameActivity(name)

  return (
    <div className='border-primary bg-secondary pt-lg lg:pt-xl flex w-full flex-col gap-1 rounded-lg border-2 lg:gap-4'>
      <h2 className='px-lg lg:px-xl font-sedan-sc text-3xl'>Activity</h2>
      <Activity
        maxHeight={width && width < 1024 ? '100%' : '520px'}
        paddingBottom={width && width < 1024 ? '0px' : '30px'}
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        noResultsLabel='No activity found for this name.'
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        showHeaders={false}
        columns={['event', 'price', 'timestamp', 'counterparty']}
      />
    </div>
  )
}

export default ActivityPanel
