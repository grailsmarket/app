'use client'

import React from 'react'
import Image from 'next/image'
import { Address } from 'ethereum-identity-kit'
import Activity from '@/components/activity'
import { useProfileActivity } from '../hooks/useActivity'
import FilterIcon from 'public/icons/filter.svg'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

interface Props {
  user: Address | undefined
}

const ActivityPanel: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } = useProfileActivity(user)

  return (
    <div className='px-md md:pt-md flex w-full flex-col gap-2'>
      <div className='md:px-md lg:px-lg flex w-full items-center justify-between gap-2'>
        <div className='flex w-auto items-center gap-2'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 md:h-10 md:w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
        </div>
      </div>
      <Activity
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        displayedAddress={user}
      />
    </div>
  )
}

export default ActivityPanel
