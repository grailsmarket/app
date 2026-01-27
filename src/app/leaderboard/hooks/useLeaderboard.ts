import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchLeaderboard } from '@/api/leaderboard'
import { LeaderboardSortBy, LeaderboardSortOrder, LeaderboardUser } from '@/types/leaderboard'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'

interface UseLeaderboardParams {
  sortBy?: LeaderboardSortBy
  sortOrder?: LeaderboardSortOrder
  clubs?: string[]
}

export const useLeaderboard = ({
  sortBy = 'names_owned',
  sortOrder = 'desc',
  clubs = [],
}: UseLeaderboardParams = {}) => {
  return useInfiniteQuery({
    queryKey: ['leaderboard', sortBy, sortOrder, clubs],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await fetchLeaderboard({
        page: pageParam,
        limit: DEFAULT_FETCH_LIMIT,
        sortBy,
        sortOrder,
        clubs,
      })
      return {
        users: response.data.users,
        nextPageParam: response.pagination.page < response.pagination.pages ? response.pagination.page + 1 : undefined,
        hasNextPage: response.pagination.page < response.pagination.pages,
        total: response.pagination.total,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: 1,
  })
}

// Flatten users from infinite query pages
export const flattenLeaderboardUsers = (data: ReturnType<typeof useLeaderboard>['data']): LeaderboardUser[] => {
  if (!data) return []
  return data.pages.flatMap((page) => page.users)
}
