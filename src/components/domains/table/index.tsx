import Image from 'next/image'
import { RefObject, useEffect, useMemo } from 'react'
import useSortFilter from '@/hooks/useSortFilter'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import TableLoadingRows from './components/TableLoadingRows'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import TableRow from './components/TableRow'
import SortArrow from 'public/icons/arrow-down.svg'
import NoResults from '@/components/ui/noResults'
import { ALL_MARKETPLACE_COLUMNS, DEFAULT_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { useWindowSize } from 'ethereum-identity-kit'

interface DomainsTableProps {
  maxHeight?: string
  domains: MarketplaceDomainType[]
  isLoading: boolean
  loadingRowCount?: number
  noResults: boolean
  listRef?: RefObject<HTMLDivElement>
  listScrollTop: number
  hasMoreDomains?: boolean
  fetchMoreDomains?: () => void
  showHeaders?: boolean
  displayedDetails?: MarketplaceHeaderColumn[]
}

const DomainsTable: React.FC<DomainsTableProps> = ({
  maxHeight,
  domains,
  isLoading,
  loadingRowCount,
  noResults,
  listRef,
  listScrollTop,
  hasMoreDomains,
  fetchMoreDomains,
  showHeaders = true,
  displayedDetails = DEFAULT_DISPLAYED_COLUMNS,
}) => {
  const { width } = useWindowSize()
  const { sort, setSortFilter } = useSortFilter()
  const { ref: loadMoreRef, isIntersecting: isLoadMoreRefIntersecting } =
    useIntersectionObserver()

  useEffect(() => {
    if (fetchMoreDomains && isLoadMoreRefIntersecting) fetchMoreDomains()
  }, [isLoadMoreRefIntersecting, fetchMoreDomains])

  const displayedColumns = useMemo(() => {
    const allColumns = ['domain', ...displayedDetails, 'actions'] as MarketplaceHeaderColumn[]
    if (!width) return allColumns

    const maxColumns = () => {
      if (width < 640) return 3
      if (width < 768) return 4
      if (width < 1024) return 5
      if (width < 1280) return 6
      if (width < 1536) return 7
      return allColumns.length
    }

    return allColumns.slice(0, maxColumns())
  }, [displayedDetails, width])

  return (
    <div className="hide-scrollbar overflow-y-auto flex w-full flex-1 flex-col lg:overflow-hidden" style={{ maxHeight }}>
      {showHeaders && <div className="flex w-full items-center justify-start bg-dark-800 px-4 py-3">
        {displayedColumns.map((header, index) => {
          const item = ALL_MARKETPLACE_COLUMNS[header]
          return (
            <div
              key={index}
              className={`flex-row items-center gap-1 ${item.getWidth(displayedColumns.length)}`}
            >
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
                className={`w-fit text-left text-xs font-medium text-light-200 ${item.sort !== 'none' &&
                  'cursor-pointer transition-colors hover:text-light-100'
                  }`}
              >
                {item.label === 'Actions' ? '' : item.label}
              </p>
              {item.sort !== 'none' && (
                <div className="w-fit">
                  <Image
                    src={SortArrow}
                    alt="sort ascending"
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
                    alt="sort descending"
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
      </div>}
      <div
        className="hide-scrollbar flex flex-col overflow-y-scroll"
        ref={listRef}
      >
        {domains?.map((domain, index) => (
          <TableRow
            key={domain.token_id}
            domain={domain}
            index={index}
            displayedColumns={displayedColumns}
          />
        ))}
        {isLoading && (
          <TableLoadingRows count={loadingRowCount} />
        )}
        {!noResults && !isLoading && hasMoreDomains && (
          <div ref={loadMoreRef} className="h-px w-full pb-px"></div>
        )}
        <div ref={loadMoreRef} className="h-px w-full pb-px"></div>
        {noResults && !isLoading && <NoResults
          label={'No results, try clearing your filters.'}
          requiresAuth={false}
        />}
      </div>
    </div>
  )
}

export default DomainsTable
