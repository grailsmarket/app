'use client'

import React from 'react'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { Address } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import { useProfileActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import useScrollToBottom from '@/hooks/useScrollToBottom'

interface Props {
  user: Address | string
  userAddress?: Address
}

const ActivityPanel: React.FC<Props> = ({ user, userAddress }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } = useProfileActivity(user)
  const isAtBottom = useScrollToBottom({ threshold: 100 })

  return (
    <div className='p-md flex flex-col gap-2'>
      <div className='md:px-md lg:px-lg flex w-full items-center justify-between gap-2'>
        <div className='flex w-auto items-center gap-2'>
          <button
            className='border-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='w-ful group focus-within:border-primary/100! hover:border-primary/70 border-primary/40 p-md flex items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-[200px] bg-transparent text-lg outline-none lg:w-[260px]'
            />
            <Image
              src={MagnifyingGlass}
              alt='Search'
              width={16}
              height={16}
              className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
            />
          </div>
        </div>
      </div>
      <Activity
        maxHeight='calc(100dvh - 190px)'
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
        displayedAddress={userAddress}
        scrollEnabled={isAtBottom}
      />
    </div>
  )
}

export default ActivityPanel
