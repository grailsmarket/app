import { RefObject, useCallback, useMemo } from 'react'
import { Address, useIsClient, useWindowSize } from 'ethereum-identity-kit'
import NoResults from '@/components/ui/noResults'
import VirtualList from '@/components/ui/virtuallist'
import { DomainOfferType, OfferColumnType } from '@/types/domains'
import LoadingRow from './components/loadingRow'
import OfferRow from './components/offerRow'
import { cn } from '@/utils/tailwind'

interface OffersProps {
  maxHeight?: string
  offers: DomainOfferType[]
  isLoading: boolean
  loadingRowCount?: number
  noResults: boolean
  noResultsLabel?: string
  paddingBottom?: string
  listRef?: RefObject<HTMLDivElement>
  hasMoreOffers?: boolean
  fetchMoreOffers?: () => void
  showHeaders?: boolean
  columns?: OfferColumnType[]
  currentUserAddress?: Address
}

const Offers: React.FC<OffersProps> = ({
  maxHeight = 'calc(100vh - 160px)',
  offers,
  isLoading,
  loadingRowCount = 10,
  noResults,
  noResultsLabel = 'No offers found.',
  columns = ['name', 'offer_amount', 'offerrer', 'expires', 'actions'],
  paddingBottom,
  listRef,
  hasMoreOffers,
  fetchMoreOffers,
  showHeaders = true,
  currentUserAddress,
}) => {
  const { width, height } = useWindowSize()

  const handleScrollNearBottom = useCallback(() => {
    if (fetchMoreOffers && hasMoreOffers && !isLoading) {
      fetchMoreOffers()
    }
  }, [fetchMoreOffers, hasMoreOffers, isLoading])

  const displayedColumns = useMemo(() => {
    const allColumns = columns
    if (!width) return allColumns

    const maxColumns = () => {
      if (width < 400) return 2
      if (width < 640) return 3
      if (width < 768) return 4
      if (width < 1024) return 5
      if (width < 1280) return 6
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

  const columnHeaders: Record<OfferColumnType, string> = {
    name: 'Name',
    offer_amount: 'Offer Amount',
    offerrer: 'Offerrer',
    expires: 'Expires',
    actions: 'Actions',
  }

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
                className={cn('flex flex-row items-center gap-1', header === 'actions' && 'justify-end')}
                style={{
                  width: `${100 / displayedColumns.length}%`,
                }}
              >
                <p className='w-fit text-left text-sm font-medium'>
                  {header === 'actions' ? '' : columnHeaders[header]}
                </p>
              </div>
            )
          })}
        </div>
      )}
      <div className='h-full w-full rounded-sm px-0' ref={listRef}>
        {!noResults ? (
          <VirtualList<DomainOfferType>
            ref={listRef}
            paddingBottom={paddingBottom}
            items={[...offers, ...Array(isLoading ? loadingRowCount : 0).fill(null)]}
            visibleCount={visibleCount}
            rowHeight={60}
            overscanCount={visibleCount}
            listHeight={maxHeight ? `calc(${maxHeight} - ${showHeaders ? 48 : 0}px)` : '600px'}
            gap={0}
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={200}
            renderItem={(item, index) => {
              if (!item)
                return (
                  <div className='px-lg flex h-[60px] w-full items-center'>
                    <LoadingRow displayedColumns={displayedColumns} />
                  </div>
                )
              return (
                <OfferRow
                  key={item.id}
                  offer={item}
                  displayedColumns={displayedColumns}
                  currentUserAddress={currentUserAddress}
                  index={index}
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

export default Offers
