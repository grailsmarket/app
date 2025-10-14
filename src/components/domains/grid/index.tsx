import { Dispatch, RefObject, SetStateAction, useEffect } from 'react'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import LoadingCard from './components/loadingCard'
import GridLoadingRows from './components/gridLoadingRows'
import { MarketplaceDomainType } from '@/types/domains'
import Card from './components/card'
import NoResults from '@/components/ui/NoResults'
import { usePathname } from 'next/navigation'

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
  const pathname = usePathname()
  const { ref: loadMoreRef, isIntersecting: isLoadMoreRefIntersecting } = useIntersectionObserver()

  useEffect(() => {
    if (setIsRefIntersecting) setIsRefIntersecting(isLoadMoreRefIntersecting)
  }, [isLoadMoreRefIntersecting, setIsRefIntersecting])

  useEffect(() => {
    if (!gridRef) return

    gridRef.current?.scrollTo({
      top: gridScrollTop,
    })
  }, [gridRef, gridScrollTop])

  return (
    <div
      style={{
        gridTemplateColumns: noResults ? undefined : 'repeat(auto-fill, minmax(177px, 1fr))',
        gridAutoRows: noResults ? undefined : 'minmax(293px,325px)',
        height: isBottomMargin ? 'calc(100vh - 150px)' : 'calc(100vh - 192px)',
      }}
      className={` ${noResults ? 'flex' : 'grid'} hide-scrollbar h-full gap-x-px overflow-y-auto`}
      ref={gridRef}
    >
      {domains?.map((domain) => (
        <Card key={domain.name} domain={domain} />
      ))}
      {isLoading && <GridLoadingRows />}
      {!noResults && hasNextPage && (
        <div ref={loadMoreRef} className='flex h-full w-full flex-1'>
          <LoadingCard />
        </div>
      )}
      <NoResults
        label={'No results, try clearing your filters or change your search term.'}
        requiresAuth={pathname.split('?')[0] === '/portfolio'}
      />
    </div>
  )
}

export default DomainsGrid
