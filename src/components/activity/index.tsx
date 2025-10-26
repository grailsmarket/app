import { RefObject, useCallback, useMemo } from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import NoResults from '@/components/ui/noResults'
import VirtualList from '@/components/ui/virtuallist'
import { ProfileActivityType } from '@/types/profile'
import LoadingRow from './components/loadingRow'
import ActivityRow from './components/activityRow'
import { NameActivityType } from '@/types/domains'

interface ActivityProps {
  maxHeight?: string
  activity: ProfileActivityType[] | NameActivityType[]
  isLoading: boolean
  loadingRowCount?: number
  noResults: boolean
  noResultsLabel?: string
  listRef?: RefObject<HTMLDivElement>
  hasMoreActivity?: boolean
  fetchMoreActivity?: () => void
  showHeaders?: boolean
}

const Activity: React.FC<ActivityProps> = ({
  maxHeight = 'calc(100vh - 160px)',
  activity,
  isLoading,
  loadingRowCount = 10,
  noResults,
  noResultsLabel = 'No results, try changing your filters.',
  listRef,
  hasMoreActivity,
  fetchMoreActivity,
  showHeaders = true,
}) => {
  const { width, height } = useWindowSize()

  const handleScrollNearBottom = useCallback(() => {
    if (fetchMoreActivity && hasMoreActivity && !isLoading) {
      fetchMoreActivity()
    }
  }, [fetchMoreActivity, hasMoreActivity, isLoading])

  const displayedColumns = useMemo(() => {
    const allColumns = ['event', 'price', 'from', 'to', 'timestamp'] as string[]
    if (!width) return allColumns

    const maxColumns = () => {
      if (width < 400) return 0
      if (width < 640) return 1
      if (width < 768) return 2
      if (width < 1024) return 3
      if (width < 1280) return 4
      if (width < 1536) return 5
      return allColumns.length
    }

    return allColumns.slice(0, maxColumns())
  }, [width])

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
        <div className='md:px-md lg:px-lg py-md flex w-full items-center justify-start sm:flex'>
          {displayedColumns.map((header, index) => {
            return (
              <div
                key={index}
                className='flex flex-row items-center gap-1'
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
            items={[...activity, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
            visibleCount={visibleCount}
            rowHeight={60}
            overscanCount={5}
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
              return <ActivityRow key={item.id} activity={item} displayedColumns={displayedColumns} />
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
