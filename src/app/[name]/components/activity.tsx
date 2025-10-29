'use client'

import React from 'react'
import { useNameActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'

interface Props {
  name: string
}

const ActivityPanel: React.FC<Props> = ({ name }) => {
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } = useNameActivity(name)

  return (
    <div className='border-primary bg-secondary pt-xl flex w-full flex-col gap-4 rounded-lg border-2'>
      <h2 className='px-xl font-sedan-sc text-3xl'>Activity</h2>
      <Activity
        maxHeight='900px'
        paddingBottom='30px'
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        noResultsLabel='No activity found for this name.'
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        showHeaders={false}
        columns={['event', 'price', 'counterparty', 'timestamp']}
      />
    </div>
  )
}

export default ActivityPanel
