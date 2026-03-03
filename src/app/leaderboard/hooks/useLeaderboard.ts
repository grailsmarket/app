import { useMemo } from 'react'
import { fetchLeaderboard } from '@/api/leaderboard'
import { useInfiniteQuery } from '@tanstack/react-query'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'
import { useBatchButtonStateQuery } from '@/hooks/useBatchButtonStateQuery'

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
  const {
    data: leaderboardData,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
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

  const addresses = useMemo(() => {
    return leaderboardData?.pages.map((page) => page.users.map((user) => user.address)) || []
  }, [leaderboardData])

  const { followStates, isFollowStatesLoading, isFetchingNextFollowStatesPage, isRefetchingFollowStates } =
    useBatchButtonStateQuery({
      addresses: addresses,
      queryKey: ['followStates', 'leaderboard'],
    })

  const leaderboardUsers = useMemo(() => {
    return leaderboardData?.pages.flatMap((page) => page.users) || []
  }, [leaderboardData])

  const leaderboardUsersWithFollowStates = useMemo(() => {
    return leaderboardUsers.map((user, index) => {
      const followState = followStates?.[index]

      return {
        ...user,
        followState: {
          state: followState?.state,
          isLoading: followState
            ? isRefetchingFollowStates
            : isFollowStatesLoading || isFetchingNextFollowStatesPage || isRefetchingFollowStates,
        },
      }
    })
  }, [leaderboardUsers, followStates, isFollowStatesLoading, isFetchingNextFollowStatesPage, isRefetchingFollowStates])

  return {
    users: leaderboardUsersWithFollowStates,
    isLoading: isLoading,
    isFetchingNextPage: isFetchingNextPage,
    hasNextPage: hasNextPage,
    fetchNextPage: fetchNextPage,
  }
}
