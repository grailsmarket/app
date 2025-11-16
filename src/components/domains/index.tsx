import { RefObject, useCallback, useMemo } from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import TableRow from './table/components/TableRow'
import NoResults from '@/components/ui/noResults'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import { ALL_MARKETPLACE_COLUMNS, MARKETPLACE_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'
import TableLoadingRow from './table/components/TableLoadingRow'
import VirtualList from '@/components/ui/virtuallist'
import VirtualGrid from '@/components/ui/virtualgrid'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import Card from './grid/components/card'
import LoadingCard from './grid/components/loadingCard'
import { cn } from '@/utils/tailwind'

interface DomainsProps {
  maxHeight?: string
  domains: MarketplaceDomainType[]
  isLoading: boolean
  loadingRowCount?: number
  noResults: boolean
  noResultsLabel?: string
  listRef?: RefObject<HTMLDivElement>
  hasMoreDomains?: boolean
  fetchMoreDomains?: () => void
  showHeaders?: boolean
  displayedDetails?: MarketplaceHeaderColumn[]
  forceViewType?: 'grid' | 'list'
  paddingBottom?: string
  scrollEnabled?: boolean
  showWatchlist?: boolean
  isBulkRenewing?: boolean
  useLocalScrollTop?: boolean
}

const Domains: React.FC<DomainsProps> = ({
  maxHeight = 'calc(100dvh - 160px)',
  domains,
  isLoading,
  loadingRowCount = 10,
  noResults,
  noResultsLabel = 'No results, try changing your filters.',
  listRef,
  hasMoreDomains,
  fetchMoreDomains,
  showHeaders = true,
  displayedDetails = MARKETPLACE_DISPLAYED_COLUMNS,
  forceViewType,
  paddingBottom,
  scrollEnabled = true,
  showWatchlist = false,
  isBulkRenewing = false,
  useLocalScrollTop = false,
}) => {
  const { viewType } = useAppSelector(selectMarketplaceDomains)
  const viewTypeToUse = forceViewType || viewType
  const { width, height } = useWindowSize()

  const handleScrollNearBottom = useCallback(() => {
    if (fetchMoreDomains && hasMoreDomains && !isLoading) {
      fetchMoreDomains()
    }
  }, [fetchMoreDomains, hasMoreDomains, isLoading])

  const displayedColumns = useMemo(() => {
    const allColumns = ['domain', ...displayedDetails, 'actions'] as MarketplaceHeaderColumn[]
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

    return [allColumns[0], ...displayedDetails.slice(0, maxColumns()), allColumns[allColumns.length - 1]]
  }, [displayedDetails, width])

  const visibleCount = useMemo(() => {
    if (!height) return 30
    return Math.floor(height / 60)
  }, [height])

  const containerWidth = useMemo(() => {
    if (!width) return 1200

    if (width >= 1728) return width - 340

    if (width < 768) return width - 8
    if (width < 1024) return width - 38
    // Account for sidebar (280px) and padding
    return width - (width < 1024 ? 48 : 344)
  }, [width])

  const isClient = useIsClient()
  if (!isClient) return null

  return (
    <div className='hide-scrollbar flex w-full flex-1 flex-col overflow-hidden' style={{ maxHeight }}>
      {showHeaders && viewTypeToUse !== 'grid' && (
        <div className='px-sm md:px-md pt-sm lg:px-lg md:py-md flex w-full items-center justify-between sm:flex'>
          {displayedColumns.map((header, index) => {
            const item = ALL_MARKETPLACE_COLUMNS[header]
            return (
              <div key={index} className={`flex flex-row items-center gap-1 ${item.getWidth(displayedColumns.length)}`}>
                <p className='text-neutral w-fit text-left text-sm font-medium'>
                  {item.label === 'Actions' ? '' : item.label}
                </p>
              </div>
            )
          })}
        </div>
      )}
      <div
        className={cn('h-full w-full rounded-sm', viewTypeToUse === 'grid' ? 'md:px-md lg:px-lg px-0' : 'px-0')}
        ref={listRef}
      >
        {!noResults ? (
          viewTypeToUse === 'grid' ? (
            <VirtualGrid<MarketplaceDomainType>
              ref={listRef}
              items={[...domains, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
              cardWidth={180}
              cardHeight={width && width < 388 ? 390 : 340}
              gap={4}
              containerPadding={width && width < 640 ? 4 : 0}
              containerWidth={containerWidth}
              overscanCount={4}
              gridHeight={maxHeight ? `calc(${maxHeight} - 24px)` : '600px'}
              paddingBottom={paddingBottom}
              onScrollNearBottom={handleScrollNearBottom}
              scrollThreshold={300}
              scrollEnabled={scrollEnabled}
              useLocalScrollTop={useLocalScrollTop}
              renderItem={(item, index, columnsCount) => {
                if (!item) return <LoadingCard key={index} />
                return (
                  <Card
                    key={item.token_id}
                    domain={item}
                    isFirstInRow={index % columnsCount === 0}
                    // @ts-expect-error - watchlist_id is not defined in the type
                    watchlistId={showWatchlist ? item.watchlist_id : undefined}
                    isBulkRenewing={isBulkRenewing}
                  />
                )
              }}
            />
          ) : (
            <VirtualList<MarketplaceDomainType>
              ref={listRef}
              items={[...domains, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
              visibleCount={visibleCount}
              rowHeight={60}
              overscanCount={visibleCount}
              listHeight={maxHeight ? `calc(${maxHeight} - ${showHeaders ? 48 : 0}px)` : '600px'}
              gap={0}
              paddingBottom={paddingBottom ? paddingBottom : '40px'}
              onScrollNearBottom={handleScrollNearBottom}
              scrollThreshold={200}
              scrollEnabled={scrollEnabled}
              useLocalScrollTop={useLocalScrollTop}
              renderItem={(item, index) => {
                if (!item)
                  return (
                    <div className='md:px-lg flex h-[60px] w-full items-center'>
                      <TableLoadingRow displayedColumns={displayedColumns} />
                    </div>
                  )
                return (
                  <TableRow
                    key={item.token_id}
                    domain={item}
                    index={index}
                    displayedColumns={displayedColumns}
                    // @ts-expect-error - watchlist_id is not defined in the type
                    watchlistId={showWatchlist ? item.watchlist_id : undefined}
                    isBulkRenewing={isBulkRenewing}
                  />
                )
              }}
            />
          )
        ) : (
          <NoResults
            label={noResultsLabel}
            requiresAuth={false}
            height={maxHeight ? `calc(${maxHeight} - ${showHeaders ? 48 : 0}px - 80px)` : '600px'}
          />
        )}
      </div>
    </div>
  )
}

export default Domains
