import { RefObject, useCallback, useMemo } from 'react'
import { Address, useIsClient, useWindowSize } from 'ethereum-identity-kit'
import NoResults from '@/components/ui/noResults'
import VirtualList from '@/components/ui/virtuallist'
import { ProfileActivityType } from '@/types/profile'
import LoadingRow from './components/loadingRow'
import ActivityRow from './components/activityRow'
import { ActivityColumnType, NameActivityType } from '@/types/domains'
import { cn } from '@/utils/tailwind'

interface ActivityProps {
  maxHeight?: string
  activity: ProfileActivityType[] | NameActivityType[]
  isLoading: boolean
  loadingRowCount?: number
  noResults: boolean
  noResultsLabel?: string
  paddingBottom?: string
  listRef?: RefObject<HTMLDivElement>
  hasMoreActivity?: boolean
  fetchMoreActivity?: () => void
  showHeaders?: boolean
  columns?: ActivityColumnType[]
  displayedAddress?: Address
}

const Activity: React.FC<ActivityProps> = ({
  maxHeight = 'calc(100vh - 160px)',
  activity,
  isLoading,
  loadingRowCount = 10,
  noResults,
  noResultsLabel = 'No results, try changing your filters.',
  columns = ['event', 'name', 'price', 'timestamp', 'counterparty'],
  paddingBottom,
  listRef,
  hasMoreActivity,
  fetchMoreActivity,
  showHeaders = true,
  displayedAddress,
}) => {
  const { width, height } = useWindowSize()

  const handleScrollNearBottom = useCallback(() => {
    if (fetchMoreActivity && hasMoreActivity && !isLoading) {
      fetchMoreActivity()
    }
  }, [fetchMoreActivity, hasMoreActivity, isLoading])

  const displayedColumns = useMemo(() => {
    const allColumns = columns
    if (!width) return allColumns

    const maxColumns = () => {
      if (width < 400) return 2
      if (width < 640) return 3
      if (width < 768) return 4
      if (width < 1024) return 5
      if (width < 1280) return 6
      if (width < 1536) return 7
      return allColumns.length
    }

    return allColumns.slice(0, maxColumns())
  }, [width, columns])

  const visibleCount = useMemo(() => {
    if (!height) return 30
    return Math.floor(height / 60)
  }, [height])

  const isClient = useIsClient()
  if (!isClient) return null

  return (
    <div
      className='hide-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:overflow-hidden'
      style={{ maxHeight }}
    >
      {showHeaders && (
        <div className='px-sm md:px-md lg:px-lg py-md flex w-full items-center justify-start sm:flex'>
          {displayedColumns.map((header, index) => {
            return (
              <div
                key={index}
                className={cn(
                  'flex flex-row items-center gap-1',
                  index + 1 === displayedColumns.length && 'justify-end'
                )}
                style={{
                  width: `${100 / displayedColumns.length}%`,
                }}
              >
                <p className='hover:text-light-100 w-fit cursor-pointer text-left text-sm font-medium transition-colors'>
                  {header}
                </p>
              </div>
            )
          })}
        </div>
      )}
      <div className='h-full w-full rounded-sm px-0' ref={listRef}>
        {!noResults ? (
          <VirtualList<ProfileActivityType>
            ref={listRef}
            paddingBottom={paddingBottom}
            items={[...activity, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
            visibleCount={visibleCount}
            rowHeight={60}
            overscanCount={visibleCount}
            listHeight={maxHeight ? `calc(${maxHeight} - ${showHeaders ? 48 : 0}px)` : '600px'}
            gap={0}
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={200}
            renderItem={(item) => {
              if (!item)
                return (
                  <div className='px-lg flex h-[60px] w-full items-center'>
                    <LoadingRow displayedColumns={displayedColumns} />
                  </div>
                )
              return (
                <ActivityRow
                  key={item.id}
                  activity={item}
                  displayedColumns={displayedColumns}
                  displayedAddress={displayedAddress}
                />
              )
            }}
          />
        ) : (
          <NoResults label={noResultsLabel} requiresAuth={false} />
        )}
      </div>
    </div>
  )
}

export default Activity
