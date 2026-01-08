'use client'

import React from 'react'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import MagnifyingGlass from 'public/icons/search.svg'
import { useCategoryActivity } from '../hooks/useActivity'
import Activity from '@/components/activity'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'

interface Props {
  category: string
}

const ActivityPanel: React.FC<Props> = ({ category }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { activity, activityLoading, fetchMoreActivity, hasMoreActivity } = useCategoryActivity(category)
  const { isNavbarVisible } = useNavbar()

  return (
    <>
      <div
        className={cn(
          'py-md md:py-lg px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row md:top-32',
          isNavbarVisible ? 'top-26' : 'top-12'
        )}
      >
        <div className='flex w-full items-center gap-2 sm:w-fit'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='group border-tertiary flex h-9 w-[calc(100%-39px)] items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:w-fit md:h-10'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-full bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
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
        containerHeight='calc(100vh - 200px)'
        activity={activity}
        loadingRowCount={20}
        noResults={!activityLoading && activity?.length === 0}
        isLoading={activityLoading}
        hasMoreActivity={hasMoreActivity}
        fetchMoreActivity={fetchMoreActivity}
      />
    </>
  )
}

export default ActivityPanel
