import { useQuery } from '@tanstack/react-query'
import { Address, fetchAccount } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { setUserEnsProfile, setWatchlistDomains } from '@/state/reducers/profile/profile'
import { useEffect } from 'react'
import { getWatchlist } from '@/api/watchlist/getWatchlist'

interface UseUserProfileProps {
  address?: Address | null
}

export const useUserProfile = ({ address }: UseUserProfileProps) => {
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
    enabled: !!address,
  })

  useEffect(() => {
    if (address) {
      dispatch(
        setUserEnsProfile({
          name: profile?.ens?.name || null,
          avatar: profile?.ens?.avatar || null,
          // @ts-expect-error the records do exist
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

      const watchlist = await getWatchlist()
      return watchlist.response.watchlist
    },
    enabled: !!address,
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
