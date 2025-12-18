'use client'

import React from 'react'
import { useNameActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import { useWindowSize } from 'ethereum-identity-kit'
import { cn } from '@/utils/tailwind'
import useScrollToBottom from '@/hooks/useScrollToBottom'

interface Props {
  name: string
}

const ActivityPanel: React.FC<Props> = ({ name }) => {
  const { width } = useWindowSize()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity, isActivityEmpty } = useNameActivity(name)
  const isAtBottom = useScrollToBottom({ threshold: 100 })

  return (
    <div
      className={cn(
        'sm:border-tertiary bg-secondary pt-lg lg:pt-xl flex w-full flex-col gap-1 sm:rounded-lg sm:border-2 lg:gap-4',
        isActivityEmpty && 'pb-6'
      )}
    >
      <h2 className='px-lg xl:px-xl font-sedan-sc text-3xl'>Activity</h2>
      <div className='px-md w-full sm:px-0'>
        <Activity
          maxHeight={width && width < 1024 ? '600px' : '536px'}
          minHeight='300px'
          paddingBottom='0px'
          activity={activity}
          loadingRowCount={20}
          noResults={isActivityEmpty}
          noResultsLabel='No activity found for this name.'
          isLoading={activityLoading}
          hasMoreActivity={hasMoreActivity}
          fetchMoreActivity={fetchMoreActivity}
          showHeaders={true}
          columns={['event', 'price', 'time', 'user']}
          scrollEnabled={isAtBottom}
          useLocalScrollTop={true}
        />
      </div>
    </div>
  )
}

export default ActivityPanel
