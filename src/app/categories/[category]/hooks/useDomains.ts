import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceDomainType } from '@/types/domains'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useUserContext } from '@/context/user'

export const useCategoryDomains = (category: string) => {
  const { selectors } = useFilterRouter()
  const { authStatus } = useUserContext()
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
    fetchNextPage: fetchMoreCategoryDomains,
    hasNextPage: hasMoreCategoryDomains,
  } = useInfiniteQuery({
    queryKey: [
      'category',
      'domains',
      category,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.type,
      filters.status,
      filters.sort,
      // @ts-expect-error the activity filter state will not be used for domains
      filters.market,
      // @ts-expect-error the text match filter state will not be used for domains
      filters.textMatch,
      // @ts-expect-error the text non-match filter state will not be used for domains
      filters.textNonMatch,
      // @ts-expect-error the offer range filter state will not be used for domains
      filters.offerRange,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const domains = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        // @ts-expect-error the activity filter state will not be used for domains
        filters,
        searchTerm: debouncedSearch,
        category: category,
        isAuthenticated: authStatus === 'authenticated',
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
  })

  const categoryDomains = useMemo(() => {
    return (
      domains?.pages?.reduce((acc, page) => {
        return [...acc, ...page.domains]
      }, [] as MarketplaceDomainType[]) || []
    )
  }, [domains])
  const categoryDomainsLoading = isLoading || isFetchingNextPage
  const totalCategoryDomains = domains?.pages[0]?.total || 0

  return {
    domains: categoryDomains,
    categoryDomainsLoading,
    fetchMoreCategoryDomains,
    hasMoreCategoryDomains,
    totalCategoryDomains,
  }
}
