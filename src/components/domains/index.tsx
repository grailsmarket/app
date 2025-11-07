import Image from 'next/image'
import { RefObject, useCallback, useMemo } from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import useSortFilter from '@/hooks/useSortFilter'
import TableRow from './table/components/TableRow'
import SortArrow from 'public/icons/arrow-down.svg'
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
}

const Domains: React.FC<DomainsProps> = ({
  maxHeight = 'calc(100vh - 160px)',
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
}) => {
  const { viewType } = useAppSelector(selectMarketplaceDomains)
  const viewTypeToUse = forceViewType || viewType
  const { width, height } = useWindowSize()
  const { sort, setSortFilter } = useSortFilter()

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

    if (width >= 1728) return 1728 - 344

    if (width < 768) return width - 8
    if (width < 1024) return width - 48
    // Account for sidebar (280px) and padding
    return width - (width < 1024 ? 48 : 344)
  }, [width])

  const isClient = useIsClient()
  if (!isClient) return null

  return (
    <div
      className='hide-scrollbar flex w-full flex-1 flex-col overflow-y-auto lg:overflow-hidden'
      style={{ maxHeight }}
    >
      {showHeaders && viewTypeToUse !== 'grid' && (
        <div className='md:px-md lg:px-lg py-md flex w-full items-center justify-start sm:flex'>
          {displayedColumns.map((header, index) => {
            const item = ALL_MARKETPLACE_COLUMNS[header]
            return (
              <div key={index} className={`flex flex-row items-center gap-1 ${item.getWidth(displayedColumns.length)}`}>
                <p
                  onClick={() => {
                    if (item.sort === 'none') return

                    if (item.value?.desc && sort === item.value?.asc) {
                      setSortFilter(item.value?.desc)
                      return
                    }

                    if (sort === item.value?.desc) {
                      setSortFilter(null)
                      return
                    }

                    setSortFilter(item.value?.asc || item.value?.desc || null)
                  }}
                  className={`w-fit text-left text-sm font-medium ${item.sort !== 'none' && 'hover:text-light-100 cursor-pointer transition-colors'
                    }`}
                >
                  {item.label === 'Actions' ? '' : item.label}
                </p>
                {item.sort !== 'none' && (
                  <div className='w-fit'>
                    <Image
                      src={SortArrow}
                      alt='sort ascending'
                      className={`rotate-180 ${sort === item.value?.asc ? 'opacity-100' : 'opacity-50'
                        } cursor-pointer transition-opacity hover:opacity-100`}
                      onClick={() => {
                        if (!item.value?.asc) return

                        if (sort?.includes(item.value?.asc)) {
                          setSortFilter(null)
                          return
                        }

                        setSortFilter(item.value?.asc)
                      }}
                    />
                    <Image
                      src={SortArrow}
                      alt='sort descending'
                      className={`${sort === item.value?.desc ? 'opacity-100' : 'opacity-50'
                        } cursor-pointer transition-opacity hover:opacity-100`}
                      onClick={() => {
                        if (!item.value?.desc) return

                        if (sort?.includes(item.value?.desc)) {
                          setSortFilter(null)
                          return
                        }

                        setSortFilter(item.value?.desc)
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <div
        className={cn('h-full w-full rounded-sm pb-20', viewTypeToUse === 'grid' ? 'md:px-md lg:px-lg' : 'px-0')}
        ref={listRef}
      >
        {!noResults ? (
          viewTypeToUse === 'grid' ? (
            <VirtualGrid<MarketplaceDomainType>
              ref={listRef}
              items={[...domains, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
              cardWidth={width && width < 640 ? 200 : 200}
              cardHeight={width && width < 420 ? 440 : 330}
              gap={4}
              containerWidth={containerWidth - (width && width < 1024 ? (width < 768 ? 0 : 16) : 32)}
              overscanCount={3}
              gridHeight={maxHeight ? `calc(${maxHeight} - ${showHeaders ? 48 : 0}px)` : '600px'}
              onScrollNearBottom={handleScrollNearBottom}
              scrollThreshold={300}
              renderItem={(item, index, columnsCount) => {
                if (!item) return <LoadingCard key={index} />
                return <Card key={item.token_id} domain={item} isFirstInRow={index % columnsCount === 0} />
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
              renderItem={(item, index) => {
                if (!item)
                  return (
                    <div className='px-lg flex h-[60px] w-full items-center'>
                      <TableLoadingRow displayedColumns={displayedColumns} />
                    </div>
                  )
                return <TableRow key={item.token_id} domain={item} index={index} displayedColumns={displayedColumns} />
              }}
            />
          )
        ) : (
          <NoResults label={noResultsLabel} requiresAuth={false} />
        )}
      </div>
    </div>
  )
}

export default Domains
