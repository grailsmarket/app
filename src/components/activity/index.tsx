import { cn } from '@/utils/tailwind'
import { RefObject, useCallback, useMemo } from 'react'
import { Address, useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { ActivityType } from '@/types/profile'
import LoadingRow from './components/loadingRow'
import NoResults from '@/components/ui/noResults'
import ActivityRow from './components/activityRow'
import VirtualList from '@/components/ui/virtuallist'
import { ActivityColumnType, NameActivityType } from '@/types/domains'

interface ActivityProps {
  maxHeight?: string
  minHeight?: string
  activity: ActivityType[] | NameActivityType[]
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
  scrollEnabled?: boolean
  useLocalScrollTop?: boolean
}

const Activity: React.FC<ActivityProps> = ({
  maxHeight = 'calc(100dvh - 160px)',
  minHeight,
  activity,
  isLoading,
  loadingRowCount = 10,
  noResults,
  noResultsLabel = 'No results, try changing your filters.',
  columns = ['event', 'name', 'price', 'time', 'user'],
  paddingBottom,
  listRef,
  hasMoreActivity,
  fetchMoreActivity,
  showHeaders = true,
  displayedAddress,
  scrollEnabled = true,
  useLocalScrollTop = false,
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

  const basecolWidthReduction =
    (displayedColumns.includes('event') ? 10 : 0) +
    (displayedColumns.includes('name') || displayedColumns.includes('user') ? 10 : 0)
  const baseColWidth = (100 - basecolWidthReduction) / displayedColumns.length
  const columnWidth = `${baseColWidth}%`
  const nameColumnWidth = `${baseColWidth + 10}%`
  const userColumnWidth = displayedColumns.includes('name') ? `${baseColWidth}%` : `${baseColWidth + 10}%`
  const eventColumnWidth = `${baseColWidth + 10}%`

  return (
    <div
      className='hide-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:overflow-hidden'
      style={{ maxHeight, minHeight }}
    >
      {showHeaders && !noResults && (
        <div className='px-sm pb-sm md:px-md lg:px-lg py-md flex w-full items-center justify-start sm:flex'>
          {displayedColumns.map((header, index) => {
            return (
              <div
                key={index}
                className={cn(
                  'flex flex-row items-center gap-1',
                  index + 1 === displayedColumns.length && 'justify-end'
                )}
                style={{
                  width:
                    header === 'name'
                      ? nameColumnWidth
                      : header === 'event'
                        ? eventColumnWidth
                        : header === 'user'
                          ? userColumnWidth
                          : columnWidth,
                }}
              >
                <p className='hover:text-light-100 w-fit cursor-pointer text-left text-sm font-medium capitalize transition-colors'>
                  {header}
                </p>
              </div>
            )
          })}
        </div>
      )}
      <div className='h-full w-full rounded-sm px-0' ref={listRef}>
        {!noResults ? (
          <VirtualList<ActivityType>
            ref={listRef}
            paddingBottom={paddingBottom}
            items={[...activity, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
            visibleCount={visibleCount}
            rowHeight={60}
            overscanCount={visibleCount}
            listHeight={maxHeight ? `calc(${maxHeight} - ${showHeaders ? 48 : 0}px)` : '600px'}
            minListHeight={minHeight}
            gap={0}
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={200}
            scrollEnabled={scrollEnabled}
            useLocalScrollTop={useLocalScrollTop}
            renderItem={(item, index) => {
              if (!item)
                return (
                  <div className='px-lg flex h-[60px] w-full items-center justify-between'>
                    <LoadingRow displayedColumns={displayedColumns} />
                  </div>
                )
              return (
                <ActivityRow
                  key={item.id}
                  activity={item}
                  displayedColumns={displayedColumns}
                  displayedAddress={displayedAddress}
                  index={index}
                />
              )
            }}
          />
        ) : (
          <NoResults label={noResultsLabel} requiresAuth={false} height={maxHeight || '600px'} />
        )}
      </div>
    </div>
  )
}

export default Activity
