'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useWindowSize, ShortArrow } from 'ethereum-identity-kit'
import VirtualList from '@/components/ui/virtuallist'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import LeaderboardRow from './LeaderboardRow'
import LeaderboardFilters from './LeaderboardFilters'
import { useLeaderboard, flattenLeaderboardUsers } from '../hooks/useLeaderboard'
import type { LeaderboardUser, LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'

// Mapping of header names to their sort values
const HEADER_SORT_MAP: Record<string, LeaderboardSortBy> = {
  names: 'names_owned',
  category_names: 'names_in_clubs',
  expired: 'expired_names',
}

const LoadingRow = () => (
  <div className='border-tertiary hover:bg-foreground/10 px-sm sm:px-md lg:px-lg flex h-[60px] w-full flex-row items-center border-b transition'>
    {/* <div className='flex w-[5%] min-w-[30px] justify-center sm:min-w-[40px]'>
      <LoadingCell width='30px' height='20px' />
    </div>
    <div className='w-[40%] md:w-[30%]'>
      <LoadingCell width='140px' height='28px' />
    </div>
    <div className='w-[20%] sm:w-[15%] lg:w-[10%]'>
      <LoadingCell width='50px' height='20px' />
    </div>
    <div className='hidden w-[15%] lg:block lg:w-[10%]'>
      <LoadingCell width='50px' height='20px' />
    </div>
    <div className='hidden w-[10%] lg:block'>
      <LoadingCell width='50px' height='20px' />
    </div>
    <div className='flex w-[25%] gap-1 sm:w-[32.5%] md:w-[30%]'>
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
    </div>
    <div className='hidden w-[5%] sm:block'></div> */}
    <div className='xs:min-w-[36px] w-[5%] min-w-[30px] sm:min-w-[40px]'>
      <LoadingCell width='30px' height='20px' />
    </div>
    <div className='text-neutral text-md w-[40%] font-medium md:w-[25%]'>
      <LoadingCell width='140px' height='28px' />
    </div>

    {/* Names - Sortable */}
    <div className='flex w-[20%] cursor-pointer items-center gap-0.5 select-none hover:opacity-80 sm:w-[15%] sm:gap-1 lg:w-[10%]'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Category Names - Sortable */}
    <div className='hidden w-[15%] md:flex lg:w-[10%]'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Listed Names - Sortable */}
    <div className='hidden w-[15%] md:flex lg:w-[10%]'>
      <LoadingCell width='50px' height='20px' />
    </div>

    {/* Expired - Sortable */}
    <div className='hidden w-[10%] lg:flex'>
      <LoadingCell width='50px' height='20px' />
    </div>

    <div className='flex w-[25%] gap-1 sm:w-[27.5%] md:w-[25%]'>
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
    </div>
    <div className='hidden w-[5%] min-w-[120px] sm:block'>
      <LoadingCell width='110px' height='37px' radius='8px' />
    </div>
  </div>
)

const LeaderboardList: React.FC = () => {
  const { height } = useWindowSize()
  const { isNavbarVisible } = useNavbar()

  // Filter state
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>('names_owned')
  const [sortOrder, setSortOrder] = useState<LeaderboardSortOrder>('desc')
  const [selectedClubs, setSelectedClubs] = useState<string[]>([])

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
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      } else {
        // Set new sort column with desc as default
        setSortBy(sortValue)
        setSortOrder('desc')
      }
    },
    [sortBy, sortOrder]
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
      <LeaderboardFilters
        sortBy={sortBy}
        sortOrder={sortOrder}
        selectedClubs={selectedClubs}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onClubsChange={setSelectedClubs}
      />

      {/* Headers */}
      <div
        className={cn(
          'py-md px-sm sm:px-md lg:px-lg transition-top bg-background border-tertiary sticky z-40 flex w-full items-center justify-start border-b duration-300',
          isNavbarVisible ? 'top-14 md:top-[70px]' : 'top-0'
        )}
      >
        <p className='text-neutral text-md xs:min-w-[36px] w-[5%] min-w-[30px] text-center font-medium sm:min-w-[40px]'>
          #
        </p>
        <p className='text-neutral text-md w-[40%] font-medium md:w-[25%]'>User</p>

        {/* Names - Sortable */}
        <div
          onClick={() => handleHeaderClick('names')}
          className='flex w-[20%] cursor-pointer items-center gap-0.5 select-none hover:opacity-80 sm:w-[15%] sm:gap-1 lg:w-[10%]'
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
          className='hidden w-[15%] cursor-pointer items-center gap-1 select-none hover:opacity-80 md:flex lg:w-[10%]'
        >
          <p className={cn('text-md font-medium', isSortedBy('category_names') ? 'text-primary' : 'text-neutral')}>
            Category Names
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
          onClick={() => handleHeaderClick('category_names')}
          className='hidden w-[15%] cursor-pointer items-center gap-1 select-none hover:opacity-80 md:flex lg:w-[10%]'
        >
          <p className={cn('text-md font-medium', isSortedBy('category_names') ? 'text-primary' : 'text-neutral')}>
            Listed
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

        {/* Expired - Sortable */}
        <div
          onClick={() => handleHeaderClick('expired')}
          className='hidden w-[10%] cursor-pointer items-center gap-1 select-none hover:opacity-80 lg:flex'
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

        <p className='text-neutral text-md w-[25%] font-medium sm:w-[27.5%] md:w-[25%]'>Categories</p>
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
                return <LoadingRow key={`loading-${index}`} />
              }
              return <LeaderboardRow key={item.address} user={item} rank={index + 1} />
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
