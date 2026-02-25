'use client'

import React, { useCallback, useMemo } from 'react'
import { useWindowSize, ShortArrow } from 'ethereum-identity-kit'
import VirtualList from '@/components/ui/virtuallist'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import LeaderboardRow from './LeaderboardRow'
import LeaderboardFilters from './LeaderboardFilters'
import { useLeaderboard, flattenLeaderboardUsers } from '../hooks/useLeaderboard'
import type { LeaderboardUser, LeaderboardSortBy } from '@/types/leaderboard'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  changeLeaderboardSortBy,
  changeLeaderboardSortOrder,
  selectLeaderboardState,
} from '@/state/reducers/leaderboard/leaderboard'

// Mapping of header names to their sort values
const HEADER_SORT_MAP: Record<string, LeaderboardSortBy> = {
  names: 'names_owned',
  category_names: 'names_in_clubs',
  expired: 'expired_names',
  names_listed: 'names_listed',
  names_sold: 'names_sold',
  sales_volume: 'sales_volume',
}

export const LoadingRow = () => (
  <div className='border-tertiary hover:bg-foreground/10 px-sm sm:px-md lg:px-lg hidden h-[60px] w-full flex-row items-center border-b transition md:flex'>
    <div className='xs:min-w-[36px] flex w-[5%] min-w-[30px] justify-center sm:min-w-[40px]'>
      <LoadingCell width='30px' height='20px' />
    </div>
    <div className='w-[25%] lg:w-[20%]'>
      <LoadingCell width='140px' height='28px' />
    </div>

    {/* Names */}
    <div className='flex w-[12.5%] items-center lg:w-[8%]'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Category Names */}
    <div className='flex w-[12.5%] lg:w-[8%]'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Listed */}
    <div className='flex w-[12.5%] lg:w-[8%]'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Sold */}
    <div className='hidden w-[8%] lg:flex'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Expired */}
    <div className='hidden w-[8%] lg:flex'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Sales Vol */}
    <div className='hidden w-[10%] lg:flex'>
      <LoadingCell width='70px' height='20px' />
    </div>

    <div className='flex w-[20%] gap-1 lg:w-[17%]'>
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
    </div>
    <div className='hidden w-[5%] min-w-[120px] justify-end sm:flex'>
      <LoadingCell width='110px' height='37px' radius='8px' />
    </div>
  </div>
)

export const MobileLoadingRow = () => (
  <div className='border-tertiary px-sm sm:px-md flex h-[60px] w-full flex-row items-center border-b md:hidden'>
    <div className='flex w-[5%] min-w-[30px] justify-center'>
      <LoadingCell width='24px' height='20px' />
    </div>
    <div className='w-[35%]'>
      <LoadingCell width='120px' height='28px' />
    </div>
    <div className='flex w-[15%]'>
      <LoadingCell width='40px' height='20px' />
    </div>
    <div className='flex w-[25%] gap-1'>
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
    </div>
    <div className='flex w-[5%] justify-end'>
      <LoadingCell width='16px' height='16px' />
    </div>
  </div>
)

const LeaderboardList: React.FC = () => {
  const { height } = useWindowSize()
  const { isNavbarVisible } = useNavbar()
  const dispatch = useAppDispatch()

  const {
    leaderboard: { sortBy, sortOrder, selectedClubs },
  } = useAppSelector(selectLeaderboardState)

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useLeaderboard({
    sortBy,
    sortOrder,
    clubs: selectedClubs,
  })

  const users = useMemo(() => flattenLeaderboardUsers(data), [data])
  const noResults = !isLoading && users.length === 0

  const handleScrollNearBottom = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Handle header click for sorting
  const handleHeaderClick = useCallback(
    (headerKey: string) => {
      const sortValue = HEADER_SORT_MAP[headerKey]
      if (!sortValue) return

      if (sortBy === sortValue) {
        // Toggle direction if already sorting by this column
        dispatch(changeLeaderboardSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'))
      } else {
        // Set new sort column with desc as default
        dispatch(changeLeaderboardSortBy(sortValue))
        dispatch(changeLeaderboardSortOrder('desc'))
      }
    },
    [sortBy, sortOrder, dispatch]
  )

  // Check if a header is the current sort column
  const isSortedBy = useCallback(
    (headerKey: string) => {
      return sortBy === HEADER_SORT_MAP[headerKey]
    },
    [sortBy]
  )

  const visibleCount = useMemo(() => {
    if (!height) return 20
    return Math.floor(height / 60)
  }, [height])

  // Create items array with loading skeletons appended when loading
  const loadingRowCount = 20
  const items: (LeaderboardUser | null)[] = useMemo(() => {
    if (isLoading) {
      return Array(loadingRowCount).fill(null)
    }
    if (isFetchingNextPage) {
      return [...users, ...Array(5).fill(null)]
    }
    return users
  }, [users, isLoading, isFetchingNextPage])

  return (
    <div className='w-full'>
      <LeaderboardFilters sortBy={sortBy} sortOrder={sortOrder} selectedClubs={selectedClubs} />

      {/* Headers */}
      <div
        className={cn(
          'py-md px-sm sm:px-md lg:px-lg transition-top bg-background border-tertiary sticky z-40 hidden w-full items-center justify-start border-b duration-300 md:flex',
          isNavbarVisible ? 'top-14 md:top-[70px]' : 'top-0'
        )}
      >
        <p className='text-neutral text-md xs:min-w-[36px] w-[5%] min-w-[30px] text-center font-medium sm:min-w-[40px]'>
          #
        </p>
        <p className='text-neutral text-md w-[25%] font-medium lg:w-[20%]'>User</p>

        {/* Names - Sortable */}
        <div
          onClick={() => handleHeaderClick('names')}
          className='flex w-[12.5%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:w-[8%]'
        >
          <p className={cn('text-md font-medium', isSortedBy('names') ? 'text-primary' : 'text-neutral')}>Names</p>
          {isSortedBy('names') && (
            <ShortArrow
              className={cn(
                'text-primary h-3 w-3 transition-transform',
                sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Category Names - Sortable */}
        <div
          onClick={() => handleHeaderClick('category_names')}
          className='flex w-[12.5%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:w-[8%]'
        >
          <p className={cn('text-md font-medium', isSortedBy('category_names') ? 'text-primary' : 'text-neutral')}>
            In Categories
          </p>
          {isSortedBy('category_names') && (
            <ShortArrow
              className={cn(
                'text-primary h-3 w-3 transition-transform',
                sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Listed Names - Sortable */}
        <div
          onClick={() => handleHeaderClick('names_listed')}
          className='flex w-[12.5%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:w-[8%]'
        >
          <p className={cn('text-md font-medium', isSortedBy('names_listed') ? 'text-primary' : 'text-neutral')}>
            Listings
          </p>
          {isSortedBy('names_listed') && (
            <ShortArrow
              className={cn(
                'text-primary h-3 w-3 transition-transform',
                sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Sold Names - Sortable */}
        <div
          onClick={() => handleHeaderClick('names_sold')}
          className='hidden w-[8%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:flex'
        >
          <p className={cn('text-md font-medium', isSortedBy('names_sold') ? 'text-primary' : 'text-neutral')}>Sales</p>
          {isSortedBy('names_sold') && (
            <ShortArrow
              className={cn(
                'text-primary h-3 w-3 transition-transform',
                sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Expired - Sortable */}
        <div
          onClick={() => handleHeaderClick('expired')}
          className='hidden w-[8%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:flex'
        >
          <p className={cn('text-md font-medium', isSortedBy('expired') ? 'text-primary' : 'text-neutral')}>Expired</p>
          {isSortedBy('expired') && (
            <ShortArrow
              className={cn(
                'text-primary h-3 w-3 transition-transform',
                sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Sales Vol - Sortable */}
        <div
          onClick={() => handleHeaderClick('sales_volume')}
          className='hidden w-[10%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:flex'
        >
          <p className={cn('text-md font-medium', isSortedBy('sales_volume') ? 'text-primary' : 'text-neutral')}>
            Sales Vol
          </p>
          {isSortedBy('sales_volume') && (
            <ShortArrow
              className={cn(
                'text-primary h-3 w-3 transition-transform',
                sortOrder === 'asc' ? 'rotate-0' : 'rotate-180'
              )}
            />
          )}
        </div>

        <p className='text-neutral text-md w-[20%] font-medium lg:w-[17%]'>Categories</p>
        <p className='text-neutral text-md hidden w-[5%] min-w-[120px] font-medium sm:block'></p>
      </div>

      {/* List */}
      <div className='w-full'>
        {!noResults ? (
          <VirtualList<LeaderboardUser | null>
            items={items}
            rowHeight={60}
            overscanCount={visibleCount}
            gap={0}
            paddingBottom='40px'
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={300}
            renderItem={(item, index) => {
              if (!item) {
                return (
                  <React.Fragment key={`loading-${index}`}>
                    <LoadingRow />
                    <MobileLoadingRow />
                  </React.Fragment>
                )
              }
              return <LeaderboardRow key={item.address} user={item} rank={index + 1} sortBy={sortBy} />
            }}
          />
        ) : (
          <NoResults label='No users found' requiresAuth={false} height='400px' />
        )}
      </div>
    </div>
  )
}

export default LeaderboardList
