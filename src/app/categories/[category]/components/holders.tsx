'use client'

import React, { useCallback, useMemo } from 'react'
import { useWindowSize } from 'ethereum-identity-kit'
import VirtualList from '@/components/ui/virtuallist'
import NoResults from '@/components/ui/noResults'
import LoadingCell from '@/components/ui/loadingCell'
import HolderRow from './holderRow'
import { useHolders, flattenHolders } from '../hooks/useHolders'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import type { Holder } from '@/api/holders'

interface HoldersPanelProps {
  category: string
}

const LoadingRow = () => (
  <div className='border-tertiary flex h-[60px] w-full items-center gap-3 border-b px-4'>
    <LoadingCell width='40px' height='40px' radius='50%' />
    <LoadingCell width='120px' height='20px' />
    <div className='flex-1' />
    <LoadingCell width='60px' height='20px' />
    <LoadingCell width='20px' height='20px' />
  </div>
)

const HoldersPanel: React.FC<HoldersPanelProps> = ({ category }) => {
  const { isNavbarVisible } = useNavbar()
  const { height } = useWindowSize()

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useHolders(category)

  const holders = useMemo(() => flattenHolders(data), [data])
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
      {/* <div
        className={cn(
          'py-md md:py-lg px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <p className='text-neutral text-lg font-medium'>
          {data?.pages[0]?.unique_holders?.toLocaleString() ?? '—'} unique holders
        </p>
      </div> */}
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
            renderItem={(item, index) => {
              if (!item) {
                return <LoadingRow />
              }
              return <HolderRow key={item.address} holder={item} category={category} index={index} />
            }}
          />
        ) : (
          <NoResults label='No holders found' requiresAuth={false} height='400px' />
        )}
      </div>
    </div>
  )
}

export default HoldersPanel
