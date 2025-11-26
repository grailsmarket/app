import { fetchDomains } from '@/api/domains/fetchDomains'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppSelector } from '@/state/hooks'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'

export const useMyDomains = () => {
  const { userAddress, authStatus } = useUserContext()
  const filters = useAppSelector(selectMyDomainsFilters)
  const debouncedSearch = useDebounce(filters.search, 500)

  const {
    data: myDomains,
    isLoading: isMyDomainsLoading,
    isFetchingNextPage: isMyDomainsFetchingNextPage,
    fetchNextPage: fetchMoreMyDomains,
    hasNextPage: hasMoreMyDomains,
  } = useInfiniteQuery({
    queryKey: [
      'portfolio',
      'domains',
      userAddress,
      authStatus,
      debouncedSearch,
      filters.length,
      filters.priceRange,
      filters.categories,
      filters.type,
      filters.status,
      filters.sort,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userAddress)
        return {
          domains: [],
          total: 0,
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const response = await fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters: filters as any, // TODO: Create separate portfolio API or adapter
        searchTerm: debouncedSearch,
        ownerAddress: userAddress,
      })

      return response
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!userAddress && authStatus === 'authenticated',
  })

  const totalDomains = myDomains?.pages[0]?.total || 0

  return {
    myDomains,
    isMyDomainsLoading,
    isMyDomainsFetchingNextPage,
    fetchMoreMyDomains,
    hasMoreMyDomains,
    totalDomains,
  }
}
