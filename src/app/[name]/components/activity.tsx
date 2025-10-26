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
    <div className='w-full border-primary bg-secondary flex gap-2 flex-col rounded-lg border-2 pt-lg'>
      <h2 className='text-3xl px-xl font-sedan-sc'>Activity</h2>
      <Activity
        maxHeight='900px'
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        noResultsLabel='No activity found for this name.'
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        showHeaders={false}
      />
    </div>
  )
}

export default ActivityPanel
