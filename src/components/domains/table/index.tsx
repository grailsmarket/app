import { Dispatch, RefObject, SetStateAction, useEffect, useMemo } from 'react'
import Image from 'next/image'

import useSortFilter from '@/app/hooks/useSortFilter'
import useIntersectionObserver from '@/app/hooks/useIntersectionObserver'
import { useStatusFilters } from '@/app/marketplace/components/LeftPanel/components/StatusFilter/hooks/useStatusFilters'

import TableLoadingRows from './components/TableLoadingRows'

import { MarketplaceDomainType } from '@/app/types/domains'
import { MARKETPLACE_DOMAIN_TABLE_HEADERS } from '@/app/constants/domains/marketplaceDomains'

import TableRow from './components/TableRow'
import Loading from '@/app/portfolio/components/Loading'

import SortArrow from '@/public/svg/filters/sort-arrow.svg'

interface DomainsTableProps {
  domains: MarketplaceDomainType[]
  isLoading: boolean
  noResults: boolean
  listRef?: RefObject<HTMLDivElement>
  listScrollTop: number
  isBottomMargin?: boolean
  setIsRefIntersecting?: Dispatch<SetStateAction<boolean>>
}

const DomainsTable: React.FC<DomainsTableProps> = ({
  domains,
  isLoading,
  noResults,
  listRef,
  listScrollTop,
  isBottomMargin,
  setIsRefIntersecting,
}) => {
  const { statusFilter } = useStatusFilters()
  const { sort, setSortFilter } = useSortFilter()
  const { ref: loadMoreRef, isIntersecting: isLoadMoreRefIntersecting } =
    useIntersectionObserver()

  useEffect(() => {
    if (setIsRefIntersecting) setIsRefIntersecting(isLoadMoreRefIntersecting)
  }, [isLoadMoreRefIntersecting, setIsRefIntersecting])

  const showLimitedDetails =
    (statusFilter.length === 1 &&
      (statusFilter.includes('Premium') ||
        statusFilter.includes('Unregistered'))) ||
    (statusFilter.length === 2 &&
      statusFilter.includes('Premium') &&
      statusFilter.includes('Unregistered'))

  const headerDisplayStyle = useMemo(
    () => [
      `flex w-1/3 md:w-1/3 lg:w-[${showLimitedDetails ? '37%' : '29.8%'}]`,
      `${showLimitedDetails ? 'hidden' : 'flex'} w-1/4 md:w-1/6 lg:w-[13.3%]`,
      'flex w-1/4 md:w-1/6 lg:w-[17.3%]',
      'hidden md:flex w-1/5 lg:w-[13.3%]',
      `hidden lg:${showLimitedDetails ? 'hidden' : 'flex'} w-[13.3%]`,
      'block w-1/5 md:w-1/6 lg:w-[13%]',
    ],
    [showLimitedDetails],
  )

  useEffect(() => {
    if (!listRef) return

    listRef.current?.scrollTo({
      top: listScrollTop,
    })
  }, [listRef])

  return (
    <div className="hide-scrollbar flex h-full w-full flex-1 flex-col bg-dark-700 lg:overflow-hidden">
      <div className="flex w-full items-center justify-start bg-dark-800 px-4 py-3">
        {MARKETPLACE_DOMAIN_TABLE_HEADERS.map((header, index) => (
          <div
            key={index}
            className={`flex-row items-center gap-1 ${headerDisplayStyle[index]}`}
            style={{
              width:
                showLimitedDetails && (index === 2 || index === 3)
                  ? '25.65%'
                  : undefined,
            }}
          >
            <p
              onClick={() => {
                if (header.sort === 'none') return

                if (header.value?.desc && sort === header.value?.asc) {
                  setSortFilter(header.value?.desc)
                  return
                }

                if (sort === header.value?.desc) {
                  setSortFilter(null)
                  return
                }

                setSortFilter(header.value?.asc || header.value?.desc || null)
              }}
              className={`w-fit text-left text-xs font-medium text-light-200 ${
                header.sort !== 'none' &&
                'cursor-pointer transition-colors hover:text-light-100'
              }`}
            >
              {header.label}
            </p>
            {header.sort !== 'none' && (
              <div className="w-fit">
                <Image
                  src={SortArrow}
                  alt="sort ascending"
                  className={`rotate-180 ${
                    sort === header.value?.asc ? 'opacity-100' : 'opacity-50'
                  } cursor-pointer transition-opacity hover:opacity-100`}
                  onClick={() => {
                    if (!header.value?.asc) return

                    if (sort?.includes(header.value?.asc)) {
                      setSortFilter(null)
                      return
                    }

                    setSortFilter(header.value?.asc)
                  }}
                />
                <Image
                  src={SortArrow}
                  alt="sort descending"
                  className={`${
                    sort === header.value?.desc ? 'opacity-100' : 'opacity-50'
                  } cursor-pointer transition-opacity hover:opacity-100`}
                  onClick={() => {
                    if (!header.value?.desc) return

                    if (sort?.includes(header.value?.desc)) {
                      setSortFilter(null)
                      return
                    }

                    setSortFilter(header.value?.desc)
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div
        className="hide-scrollbar flex flex-col overflow-y-scroll border-t border-t-dark-900"
        style={{
          height: isBottomMargin
            ? 'calc(100vh - 288px)'
            : 'calc(100vh - 245px)',
        }}
        ref={listRef}
      >
        {domains?.map((domain, index) => (
          <TableRow
            key={domain.name_ens}
            domain={domain}
            index={index}
            showLimitedDetails={showLimitedDetails}
            headerDisplayStyle={headerDisplayStyle}
          />
        ))}
        <div ref={loadMoreRef} className="h-px w-full pb-px"></div>
        <Loading
          noResults={noResults}
          noResultsLabel={'No results, try clearing your filters.'}
          LoadingComponent={TableLoadingRows}
          showLimitedDetails={showLimitedDetails}
          isLoading={isLoading}
          requiresAuth={false}
        />
      </div>
    </div>
  )
}

export default DomainsTable
