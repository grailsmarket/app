'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useWindowSize } from 'ethereum-identity-kit'
import VirtualList from '@/components/ui/virtuallist'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import LeaderboardRow from './LeaderboardRow'
import LeaderboardFilters from './LeaderboardFilters'
import { useLeaderboard, flattenLeaderboardUsers } from '../hooks/useLeaderboard'
import type { LeaderboardUser, LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'

const LoadingRow = () => (
  <div className='border-tertiary px-md lg:px-lg flex h-[60px] w-full items-center gap-3 border-b'>
    <div className='flex justify-center sm:w-[5%]'>
      <LoadingCell width='30px' height='20px' />
    </div>
    <div className='w-[40%] sm:w-[30%] lg:w-[25%]'>
      <LoadingCell width='140px' height='28px' />
    </div>
    <div className='hidden w-[10%] sm:block'>
      <LoadingCell width='50px' height='20px' />
    </div>
    <div className='hidden w-[10%] md:block'>
      <LoadingCell width='50px' height='20px' />
    </div>
    <div className='hidden w-[10%] lg:block'>
      <LoadingCell width='50px' height='20px' />
    </div>
    <div className='flex w-[30%] gap-1'>
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
      <LoadingCell width='24px' height='24px' radius='50%' />
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

  const visibleCount = useMemo(() => {
    if (!height) return 20
    return Math.floor(height / 60)
  }, [height])

  // Create items array with loading skeletons appended when loading
  const loadingRowCount = 10
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
          'py-md px-md lg:px-lg transition-top bg-background border-tertiary sticky z-40 flex w-full items-center justify-start border-b duration-300',
          isNavbarVisible ? 'top-14 md:top-[70px]' : 'top-0'
        )}
      >
        <p className='text-neutral text-md w-[5%] min-w-[30px] text-center font-medium sm:min-w-[40px]'>#</p>
        <p className='text-neutral text-md w-[40%] font-medium md:w-[30%]'>User</p>
        <p className='text-neutral text-md w-[20%] font-medium sm:w-[15%] lg:w-[10%]'>Names</p>
        <p className='text-neutral text-md hidden w-[15%] font-medium md:block lg:w-[10%]'>Category Names</p>
        <p className='text-neutral text-md hidden w-[10%] font-medium lg:block'>Expired</p>
        <p className='text-neutral text-md w-[25%] font-medium sm:w-[32.5%] md:w-[30%]'>Categories</p>
        <p className='text-neutral text-md hidden w-[5%] font-medium sm:block'></p>
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
