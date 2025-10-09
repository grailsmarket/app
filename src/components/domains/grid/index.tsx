import { Dispatch, RefObject, SetStateAction, useEffect } from 'react'

import useIntersectionObserver from '@/app/hooks/useIntersectionObserver'

import LoadingCard from './components/LoadingCard'
import GridLoadingRows from './components/GridLoadingRows'

import { MarketplaceDomainType } from '@/app/types/domains'

import Card from './components/Card'
import Loading from '@/app/portfolio/components/Loading'

interface DomainsGridProps {
  domains: MarketplaceDomainType[]
  isLoading: boolean
  noResults: boolean
  hasNextPage?: boolean
  gridRef?: RefObject<HTMLDivElement>
  gridScrollTop: number
  isBottomMargin?: boolean
  setIsRefIntersecting?: Dispatch<SetStateAction<boolean>>
}

const DomainsGrid: React.FC<DomainsGridProps> = ({
  domains,
  isLoading,
  noResults,
  hasNextPage,
  gridRef,
  gridScrollTop,
  isBottomMargin,
  setIsRefIntersecting,
}) => {
  const { ref: loadMoreRef, isIntersecting: isLoadMoreRefIntersecting } =
    useIntersectionObserver()

  useEffect(() => {
    if (setIsRefIntersecting) setIsRefIntersecting(isLoadMoreRefIntersecting)
  }, [isLoadMoreRefIntersecting, setIsRefIntersecting])

  useEffect(() => {
    if (!gridRef) return

    gridRef.current?.scrollTo({
      top: gridScrollTop,
    })
  }, [gridRef])

  return (
    <div
      style={{
        gridTemplateColumns: noResults
          ? undefined
          : 'repeat(auto-fill, minmax(177px, 1fr))',
        gridAutoRows: noResults ? undefined : 'minmax(293px,325px)',
        height: isBottomMargin ? 'calc(100vh - 150px)' : 'calc(100vh - 192px)',
      }}
      className={` ${
        noResults ? 'flex' : 'grid'
      } hide-scrollbar h-full gap-x-px overflow-y-auto`}
      ref={gridRef}
    >
      {domains?.map((domain) => (
        <Card key={domain.name_ens} domain={domain} />
      ))}
      {!noResults && hasNextPage && (
        <div ref={loadMoreRef} className="flex h-full w-full flex-1">
          <LoadingCard />
        </div>
      )}
      <Loading
        noResults={noResults}
        noResultsLabel={'No results, try clearing your filters.'}
        LoadingComponent={GridLoadingRows}
        isLoading={isLoading}
        requiresAuth={false}
      />
    </div>
  )
}

export default DomainsGrid
