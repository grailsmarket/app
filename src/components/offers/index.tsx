import { RefObject, useCallback, useMemo } from 'react'
import { Address, useIsClient, useWindowSize } from 'ethereum-identity-kit'
import NoResults from '@/components/ui/noResults'
import VirtualList from '@/components/ui/virtuallist'
import { DomainOfferType, OfferColumnType } from '@/types/domains'
import LoadingRow from './components/loadingRow'
import OfferRow from './components/offerRow'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'

interface OffersProps {
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
  useLocalScrollTop?: boolean
}

const Offers: React.FC<OffersProps> = ({
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
  useLocalScrollTop = false,
}) => {
  const { width, height } = useWindowSize()
  const { isNavbarVisible } = useNavbar()
  const handleScrollNearBottom = useCallback(() => {
    if (fetchMoreOffers && hasMoreOffers && !isLoading) {
      fetchMoreOffers()
    }
  }, [fetchMoreOffers, hasMoreOffers, isLoading])

  const displayedColumns = useMemo(() => {
    const allColumns = columns
    if (!width) return allColumns

    const maxColumns = () => {
      if (width < 420) return 2
      if (width < 640) return 2
      if (width < 768) return 3
      if (width < 1024) return 5
      if (width < 1280) return 6
      return allColumns.length
    }

    const newColumns = [...allColumns.slice(0, maxColumns())]
    const allIncludesActions = columns.includes('actions')
    const newColumnsIncludesActions = newColumns.includes('actions')
    if (allIncludesActions && !newColumnsIncludesActions) {
      newColumns.push('actions')
    }
    if (!allIncludesActions && newColumnsIncludesActions) {
      newColumns.pop()
    }
    return newColumns as OfferColumnType[]
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
    offerrer: 'Bidder',
    expires: 'Expires',
    actions: 'Actions',
  }

  return (
    <div className='flex w-full flex-1 flex-col'>
      {showHeaders && (
        <div
          className={cn(
            'px-md bg-background transition-top lg:px-lg border-tertiary py-md sticky z-40 flex w-full items-center justify-between border-b duration-300 sm:flex md:top-48',
            isNavbarVisible ? 'top-38' : 'top-24'
          )}
        >
          {displayedColumns.map((header, index) => {
            const columnWidth = `${(100 - 20) / displayedColumns.length}%`
            const nameWidth = `${(100 - 20) / displayedColumns.length + 15}%`
            const offerrerWidth = `${(100 - 20) / displayedColumns.length + 5}%`

            return (
              <div
                key={index}
                className={cn('flex flex-row items-center gap-1', header === 'actions' && 'justify-end')}
                style={{
                  width: header === 'name' ? nameWidth : header === 'offerrer' ? offerrerWidth : columnWidth,
                }}
              >
                <p className='text-neutral w-fit text-left text-sm font-medium'>
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
            rowHeight={60}
            overscanCount={visibleCount}
            gap={0}
            onScrollNearBottom={handleScrollNearBottom}
            scrollThreshold={200}
            useLocalScrollTop={useLocalScrollTop}
            renderItem={(item, index) => {
              if (!item)
                return (
                  <div className='px-md md:px-lg border-tertiary flex h-[60px] w-full items-center border-b'>
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
          <NoResults label={noResultsLabel} requiresAuth={false} height='400px' />
        )}
      </div>
    </div>
  )
}

export default Offers
