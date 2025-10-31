import { Address } from 'viem'
import { useMemo } from 'react'
import { fetchAccount } from 'ethereum-identity-kit'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchProfileActivity } from '@/api/activity/profile'
import { ProfileActivityType } from '@/types/profile'
import { ActivityTypeFilterType } from '@/state/reducers/filters/profileActivityFilters'

export const useProfileActivity = (user: Address | string) => {
  const { selectors } = useFilterRouter()
  const filters = selectors.filters
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  const { data: profile } = useQuery({
    queryKey: ['profile', user],
    queryFn: () => fetchAccount(user),
    enabled: !!user,
  })

  const {
    data: activity,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreActivity,
    hasNextPage: hasMoreActivity,
  } = useInfiniteQuery({
    queryKey: ['profile', 'activity', profile?.address || user, debouncedSearch, filters.type],
    queryFn: async ({ pageParam = 1 }) => {
      console.log(profile?.address)
      if (!profile?.address)
        return {
          activity: [],
          nextPageParam: pageParam,
          hasNextPage: false,
        }

      const results = await fetchProfileActivity({
        address: profile?.address as Address,
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        eventTypes: filters.type as ActivityTypeFilterType[],
      })

      return {
        activity: results.activity,
        nextPageParam: results.nextPageParam,
        hasNextPage: results.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
  })

  const activityData = useMemo(() => {
    return (
      activity?.pages?.reduce((acc, page) => {
        return [...acc, ...page.activity]
      }, [] as ProfileActivityType[]) || []
    )
  }, [activity])
  const activityLoading = isLoading || isFetchingNextPage

  return {
    activity: activityData,
    activityLoading,
    fetchMoreActivity,
    hasMoreActivity,
  }
}
