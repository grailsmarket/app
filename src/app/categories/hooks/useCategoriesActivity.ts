import { useMemo } from 'react'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ActivityType } from '@/types/profile'
import { ActivityTypeFilterType } from '@/state/reducers/filters/profileActivityFilters'
import { fetchAllActivity } from '@/api/activity/all'

export const useCategoriesActivity = () => {
  const { selectors } = useFilterRouter()
  const filters = selectors.filters
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  const {
    data: activity,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreActivity,
    hasNextPage: hasMoreActivity,
  } = useInfiniteQuery({
    queryKey: ['categories', 'activity', debouncedSearch, filters.type],
    queryFn: async ({ pageParam = 1 }) => {
      const results = await fetchAllActivity({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        eventTypes: filters.type as ActivityTypeFilterType[],
        categories: 'any',
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
      }, [] as ActivityType[]) || []
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
