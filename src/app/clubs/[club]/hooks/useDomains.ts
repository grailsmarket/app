import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

export const useClubDomains = (club: string) => {
  const { selectors } = useFilterRouter()
  const filters = selectors.filters
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  // const { data: clubdetails } = useQuery({
  //   queryKey: ['club', club],
  //   queryFn: () => fetchClubDetails(user),
  //   enabled: !!club,
  // })

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreClubDomains,
    hasNextPage: hasMoreClubDomains,
  } = useInfiniteQuery({
    queryKey: [
      'club',
      'domains',
      club,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const domains = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        // @ts-expect-error the activity filter state will not be used for domains
        filters,
        searchTerm: debouncedSearch,
        club: club,
      })

      return {
        domains: domains.domains,
        nextPageParam: domains.nextPageParam,
        hasNextPage: domains.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
  })

  const clubDomains = useMemo(() => {
    return (
      domains?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domains])
  const clubDomainsLoading = isLoading || isFetchingNextPage

  return {
    domains: clubDomains,
    clubDomainsLoading,
    fetchMoreClubDomains,
    hasMoreClubDomains,
  }
}
