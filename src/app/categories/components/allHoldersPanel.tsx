'use client'

import React, { useCallback, useMemo } from 'react'
import { useWindowSize } from 'ethereum-identity-kit'
import VirtualList from '@/components/ui/virtuallist'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import AllHolderRow from './allHolderRow'
import { useAllHolders, flattenAllHolders } from '../hooks/useAllHolders'
import type { Holder } from '@/api/holders'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'

const LoadingRow = () => (
  <div className='border-tertiary flex h-[60px] w-full items-center gap-3 border-b px-4'>
    <LoadingCell width='40px' height='40px' radius='50%' />
    <LoadingCell width='120px' height='20px' />
    <div className='flex-1' />
    <LoadingCell width='60px' height='20px' />
    <LoadingCell width='20px' height='20px' />
  </div>
)

const AllHoldersPanel: React.FC = () => {
  const { height } = useWindowSize()
  const { isNavbarVisible } = useNavbar()
  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useAllHolders()

  const holders = useMemo(() => flattenAllHolders(data), [data])
  const noResults = !isLoading && holders.length === 0

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
  const items: (Holder | null)[] = useMemo(() => {
    if (isLoading) {
      return Array(loadingRowCount).fill(null)
    }
    if (isFetchingNextPage) {
      return [...holders, ...Array(5).fill(null)]
    }
    return holders
  }, [holders, isLoading, isFetchingNextPage])

  return (
    <div className='w-full'>
      <div
        className={cn(
          'py-md px-md transition-top bg-background border-tertiary sticky z-50 flex w-full items-center justify-start border-b duration-300 lg:px-4',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <p className='text-neutral text-md w-[45%] font-medium'>Users</p>
        <p className='text-neutral text-md w-[50%] font-medium'>Names</p>
        <p className='text-neutral text-md w-[5%] font-medium'></p>
      </div>
      <div className='w-full'>
        {!noResults ? (
          <VirtualList<Holder | null>
            items={items}
            rowHeight={60}
            overscanCount={visibleCount}
            gap={0}
            paddingBottom='40px'
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={300}
            renderItem={(item) => {
              if (!item) {
                return <LoadingRow />
              }
              return <AllHolderRow key={item.address} holder={item} />
            }}
          />
        ) : (
          <NoResults label='No holders found' requiresAuth={false} height='400px' />
        )}
      </div>
    </div>
  )
}

export default AllHoldersPanel
