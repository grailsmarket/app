import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectDomainsConfig } from '@/state/reducers/dashboard/selectors'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { useDebounce } from '@/hooks/useDebounce'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'

export const useDashboardDomains = (instanceId: string) => {
  const config = useAppSelector((state) => selectDomainsConfig(state, instanceId))
  const filters = config?.filters

  const debouncedSearch = useDebounce(filters?.search ?? '', 500)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['dashboard', 'domains', instanceId, debouncedSearch, filters],
    queryFn: async ({ pageParam }) => {
      if (!filters) throw new Error('No filters')
      return fetchDomains({
        searchTerm: debouncedSearch,
        filters,
        pageParam: pageParam ?? 1,
        limit: DEFAULT_FETCH_LIMIT,
      })
    },
    getNextPageParam: (lastPage) => lastPage?.nextPageParam,
    initialPageParam: undefined as number | undefined,
    enabled: !!filters,
  })

  const domains = useMemo(() => data?.pages?.flatMap((page) => page?.domains ?? []) ?? [], [data])

  const total = data?.pages?.[0]?.total ?? 0

  return {
    domains,
    total,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
  }
}
