import { useMemo } from 'react'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchNameActivity } from '@/api/activity/name'
import { NameActivityType } from '@/types/domains'

export const useNameActivity = (name: string) => {
  const {
    data: activity,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreActivity,
    hasNextPage: hasMoreActivity,
  } = useInfiniteQuery({
    queryKey: ['name', 'activity', name],
    queryFn: async ({ pageParam = 1 }) => {
      const activity = await fetchNameActivity({ name, limit: DEFAULT_FETCH_LIMIT, pageParam })

      return {
        activity: activity.activity,
        nextPageParam: activity.nextPageParam,
        hasNextPage: activity.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
  })

  const activityData = useMemo(() => {
    return (
      activity?.pages?.reduce((acc, page) => {
        return [...acc, ...page.activity]
      }, [] as NameActivityType[]) || []
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
