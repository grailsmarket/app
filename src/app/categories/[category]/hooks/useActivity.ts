// import { Address } from 'viem'
// import { useMemo } from 'react'
// import { fetchAccount } from 'ethereum-identity-kit'
// import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
// import { useDebounce } from '@/hooks/useDebounce'
// import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
// import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
// import { fetchProfileActivity } from '@/api/activity/profile'
// import { ActivityType } from '@/types/profile'

// export const useClubActivity = (club: string) => {
//   const { selectors } = useFilterRouter()
//   const filters = selectors.filters
//   const debouncedSearch = useDebounce(selectors.filters.search, 500)

//   const { data: profile } = useQuery({
//     queryKey: ['club', club],
//     queryFn: () => fetchClubDetails(club),
//     enabled: !!club,
//   })

//   const {
//     data: activity,
//     isLoading,
//     isFetchingNextPage,
//     fetchNextPage: fetchMoreActivity,
//     hasNextPage: hasMoreActivity,
//   } = useInfiniteQuery({
//     queryKey: ['club', 'activity', club, debouncedSearch, filters.type],
//     queryFn: async ({ pageParam = 0 }) => {
//       const results = await fetchClubActivity({
//         club: club,
//         limit: DEFAULT_FETCH_LIMIT,
//         pageParam,
//       })

//       return {
//         activity: results.activity,
//         nextPageParam: results.nextPageParam,
//         hasNextPage: results.hasNextPage,
//       }
//     },
//     getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
//     initialPageParam: 0,
//   })

//   const activityData = useMemo(() => {
//     return (
//       activity?.pages?.reduce((acc, page) => {
//         return [...acc, ...page.activity]
//       }, [] as ActivityType[]) || []
//     )
//   }, [activity])
//   const activityLoading = isLoading || isFetchingNextPage

//   return {
//     activity: activityData,
//     activityLoading,
//     fetchMoreActivity,
//     hasMoreActivity,
//   }
// }
