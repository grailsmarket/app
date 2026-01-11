import { cn } from '@/utils/tailwind'
import { RefObject, useCallback, useMemo } from 'react'
import { Address, useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { ActivityType } from '@/types/profile'
import LoadingRow from './components/loadingRow'
import NoResults from '@/components/ui/noResults'
import ActivityRow from './components/activityRow'
import VirtualList from '@/components/ui/virtuallist'
import { ActivityColumnType, NameActivityType } from '@/types/domains'
import { useNavbar } from '@/context/navbar'

interface ActivityProps {
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
  useLocalScrollTop?: boolean
  containerScroll?: boolean
  containerHeight?: string
  stickyHeaders?: boolean
}

const Activity: React.FC<ActivityProps> = ({
  activity,
  isLoading,
  loadingRowCount = 10,
  noResults,
  noResultsLabel = 'No results, try changing your filters.',
  columns = ['event', 'name', 'price', 'user'],
  paddingBottom,
  listRef,
  hasMoreActivity,
  fetchMoreActivity,
  showHeaders = true,
  displayedAddress,
  useLocalScrollTop = false,
  containerScroll = false,
  containerHeight,
  stickyHeaders = true,
}) => {
  const { width, height } = useWindowSize()
  const { isNavbarVisible } = useNavbar()
  const handleScrollNearBottom = useCallback(() => {
    if (fetchMoreActivity && hasMoreActivity && !isLoading) {
      fetchMoreActivity()
    }
  }, [fetchMoreActivity, hasMoreActivity, isLoading])

  const displayedColumns = useMemo(() => {
    const allColumns = columns
    if (!width) return allColumns

    const maxColumns = () => {
      if (width < 450) return 2
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
    <div className='flex w-full flex-1 flex-col'>
      {showHeaders && !noResults && (
        <div
          className={cn(
            'pt-sm transition-top border-tertiary px-md lg:px-lg sm:py-md sticky flex w-full items-center justify-start border-b duration-300 sm:flex',
            stickyHeaders ? 'sitcky bg-background z-50' : '',
            stickyHeaders && (isNavbarVisible ? 'top-38 md:top-48' : 'top-24 md:top-30')
          )}
        >
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
                <p className='text-neutral w-fit cursor-pointer text-left text-sm font-medium capitalize'>{header}</p>
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
            rowHeight={60}
            overscanCount={visibleCount}
            gap={0}
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={200}
            useLocalScrollTop={useLocalScrollTop}
            containerScroll={containerScroll}
            containerHeight={containerHeight}
            renderItem={(item, index) => {
              if (!item)
                return (
                  <div className='px-md md:px-lg border-tertiary flex h-[60px] w-full items-center justify-between border-b'>
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
          <NoResults label={noResultsLabel} requiresAuth={false} height='400px' />
        )}
      </div>
    </div>
  )
}

export default Activity
