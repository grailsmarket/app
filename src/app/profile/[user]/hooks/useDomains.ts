import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Address } from 'viem'
import { useMemo } from 'react'
import { fetchAccount } from 'ethereum-identity-kit'

export const useProfileDomains = (user: Address | string) => {
  const { selectors } = useFilterRouter()
  const filters = selectors.filters
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  const { data: profile } = useQuery({
    queryKey: ['profile', user],
    queryFn: () => fetchAccount(user),
    enabled: !!user,
  })

  const {
    data: domains,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreDomains,
    hasNextPage: hasMoreDomains,
  } = useInfiniteQuery({
    queryKey: [
      'profile',
      'domains',
      profile?.address || user,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!profile?.address)
        return {
          domains: [],
          total: 0,
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const domains = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        // @ts-expect-error the activity filter state will not be used for domains
        filters,
        searchTerm: debouncedSearch,
        ownerAddress: profile?.address,
      })

      return {
        domains: domains.domains,
        total: domains.total,
        nextPageParam: domains.nextPageParam,
        hasNextPage: domains.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!profile?.address,
  })

  const domainsData = useMemo(() => {
    return (
      domains?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domains])
  const domainsLoading = isLoading || isFetchingNextPage
  const totalDomains = domains?.pages[0]?.total || 0

  return {
    domains: domainsData,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    totalDomains,
  }
}
