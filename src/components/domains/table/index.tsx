import Image from 'next/image'
import { Dispatch, RefObject, SetStateAction, useEffect } from 'react'
import useSortFilter from '@/hooks/useSortFilter'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import TableLoadingRows from './components/TableLoadingRows'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import TableRow from './components/TableRow'
import SortArrow from 'public/icons/arrow-down.svg'
import NoResults from '@/components/ui/noResults'
import { ALL_MARKETPLACE_COLUMNS, DEFAULT_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'

interface DomainsTableProps {
  domains: MarketplaceDomainType[]
  isLoading: boolean
  loadingRowCount?: number
  noResults: boolean
  listRef?: RefObject<HTMLDivElement>
  listScrollTop: number
  setIsRefIntersecting?: Dispatch<SetStateAction<boolean>>
  showHeaders?: boolean
  displayedDetails?: MarketplaceHeaderColumn[]
}

const DomainsTable: React.FC<DomainsTableProps> = ({
  domains,
  isLoading,
  loadingRowCount,
  noResults,
  listRef,
  listScrollTop,
  setIsRefIntersecting,
  showHeaders = true,
  displayedDetails = DEFAULT_DISPLAYED_COLUMNS,
}) => {
  const { sort, setSortFilter } = useSortFilter()
  const { ref: loadMoreRef, isIntersecting: isLoadMoreRefIntersecting } =
    useIntersectionObserver()

  useEffect(() => {
    if (setIsRefIntersecting) setIsRefIntersecting(isLoadMoreRefIntersecting)
  }, [isLoadMoreRefIntersecting, setIsRefIntersecting])

  useEffect(() => {
    if (!listRef) return

    listRef.current?.scrollTo({
      top: listScrollTop,
    })
  }, [listRef, listScrollTop])

  const displayedColumns = ['domain', ...displayedDetails, 'actions'] as MarketplaceHeaderColumn[]

  return (
    <div className="hide-scrollbar flex w-full flex-1 flex-col bg-dark-700 lg:overflow-hidden">
      {showHeaders && <div className="flex w-full items-center justify-start bg-dark-800 px-4 py-3">
        {displayedColumns.map((header, index) => (
          <div
            key={index}
            className={`flex-row items-center gap-1 ${ALL_MARKETPLACE_COLUMNS[header].getWidth(displayedColumns.length)}`}
          >
            <p
              onClick={() => {
                if (ALL_MARKETPLACE_COLUMNS[header].sort === 'none') return

                if (ALL_MARKETPLACE_COLUMNS[header].value?.desc && sort === ALL_MARKETPLACE_COLUMNS[header].value?.asc) {
                  setSortFilter(ALL_MARKETPLACE_COLUMNS[header].value?.desc)
                  return
                }

                if (sort === ALL_MARKETPLACE_COLUMNS[header].value?.desc) {
                  setSortFilter(null)
                  return
                }

                setSortFilter(ALL_MARKETPLACE_COLUMNS[header].value?.asc || ALL_MARKETPLACE_COLUMNS[header].value?.desc || null)
              }}
              className={`w-fit text-left text-xs font-medium text-light-200 ${ALL_MARKETPLACE_COLUMNS[header].sort !== 'none' &&
                'cursor-pointer transition-colors hover:text-light-100'
                }`}
            >
              {ALL_MARKETPLACE_COLUMNS[header].label === 'Actions' ? '' : ALL_MARKETPLACE_COLUMNS[header].label}
            </p>
            {ALL_MARKETPLACE_COLUMNS[header].sort !== 'none' && (
              <div className="w-fit">
                <Image
                  src={SortArrow}
                  alt="sort ascending"
                  className={`rotate-180 ${sort === ALL_MARKETPLACE_COLUMNS[header].value?.asc ? 'opacity-100' : 'opacity-50'
                    } cursor-pointer transition-opacity hover:opacity-100`}
                  onClick={() => {
                    if (!ALL_MARKETPLACE_COLUMNS[header].value?.asc) return

                    if (sort?.includes(ALL_MARKETPLACE_COLUMNS[header].value?.asc)) {
                      setSortFilter(null)
                      return
                    }

                    setSortFilter(ALL_MARKETPLACE_COLUMNS[header].value?.asc)
                  }}
                />
                <Image
                  src={SortArrow}
                  alt="sort descending"
                  className={`${sort === ALL_MARKETPLACE_COLUMNS[header].value?.desc ? 'opacity-100' : 'opacity-50'
                    } cursor-pointer transition-opacity hover:opacity-100`}
                  onClick={() => {
                    if (!ALL_MARKETPLACE_COLUMNS[header].value?.desc) return

                    if (sort?.includes(ALL_MARKETPLACE_COLUMNS[header].value?.desc)) {
                      setSortFilter(null)
                      return
                    }

                    setSortFilter(ALL_MARKETPLACE_COLUMNS[header].value?.desc)
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>}
      <div
        className="hide-scrollbar flex flex-col overflow-y-scroll"
        ref={listRef}
      >
        {domains?.map((domain, index) => (
          <TableRow
            key={domain.name}
            domain={domain}
            index={index}
            displayedColumns={displayedColumns}
          />
        ))}
        {isLoading && (
          <TableLoadingRows count={loadingRowCount} />
        )}
        {!noResults && (
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
