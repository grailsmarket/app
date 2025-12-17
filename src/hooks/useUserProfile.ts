import { useQuery } from '@tanstack/react-query'
import { Address, fetchAccount } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { setUserEnsProfile, setWatchlistDomains } from '@/state/reducers/portfolio/profile'
import { useEffect } from 'react'
import { getWatchlist } from '@/api/watchlist/getWatchlist'
import { AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'

interface UseUserProfileProps {
  address?: Address | null
  authStatus?: AuthenticationStatus
}

export const useUserProfile = ({ address, authStatus }: UseUserProfileProps) => {
  const dispatch = useAppDispatch()

  const {
    data: profile,
    isLoading: profileIsLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null

      const profile = await fetchAccount(address)
      return profile
    },
    enabled: !!address && authStatus === 'authenticated',
  })

  useEffect(() => {
    if (address) {
      dispatch(
        setUserEnsProfile({
          name: profile?.ens?.name || null,
          avatar: profile?.ens?.avatar || null,
          header: profile?.ens?.records?.header || null,
        })
      )
    }
  }, [address, profile, dispatch])

  const {
    data: watchlist,
    isLoading: watchlistIsLoading,
    refetch: refetchWatchlist,
  } = useQuery({
    queryKey: ['watchlist', address],
    queryFn: async () => {
      if (!address) return null

      const result = await getWatchlist({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam: 1,
        // @ts-expect-error the filters do exist
        filters: {},
        searchTerm: '',
      })

      return result.watchlist
    },
    enabled: !!address && authStatus === 'authenticated',
  })

  useEffect(() => {
    if (address) {
      dispatch(setWatchlistDomains(watchlist || []))
    }
  }, [address, watchlist, dispatch])

  return {
    profile,
    profileIsLoading,
    watchlist,
    watchlistIsLoading,
    refetchProfile,
    refetchWatchlist,
  }
}
