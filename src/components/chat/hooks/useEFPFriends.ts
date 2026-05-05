import { useUserContext } from '@/context/user'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { FollowingResponse, getUserFollowing } from '@/api/efp/getUserFollowing'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { useEffect } from 'react'
import { fetchProfileStats } from 'ethereum-identity-kit'

const FETCH_LIMIT = 30

export const useEFPFriends = (search: string) => {
  const { userAddress } = useUserContext()
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    rootMargin: '200px 0px 0px 0px',
    threshold: 0.5,
  })

  const { data: followingCount, isLoading: isLoadingFollowingCount } = useQuery({
    queryKey: ['stats', userAddress],
    queryFn: async () => {
      if (!userAddress) return null
      const result = await fetchProfileStats(userAddress)
      return result.following_count
    },
    enabled: !!userAddress,
  })

  const {
    data: following,
    isLoading: isLoadingFollowing,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['following', userAddress, search],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userAddress) {
        return {
          results: [],
          nextPageParam: pageParam,
          hasNextPage: false,
        }
      }

      const results = await getUserFollowing({
        limit: FETCH_LIMIT,
        offset: pageParam,
        addressOrName: userAddress,
        search,
      })

      return {
        results,
        nextPageParam: pageParam + 1,
        hasNextPage: results.length >= FETCH_LIMIT,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 0,
    enabled: !!userAddress,
  })

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage])

  const friends = following?.pages.reduce((acc, page) => [...acc, ...page.results], [] as FollowingResponse[])
  const isLoading = isLoadingFollowing || isFetchingNextPage

  return {
    friends,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    loadMoreRef,
    followingCount,
    isLoadingFollowingCount,
  }
}
