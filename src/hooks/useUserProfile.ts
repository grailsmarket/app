import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'
import { useAppDispatch } from '@/state/hooks'
import { setUserEnsProfile } from '@/state/reducers/profile/profile'
import { useEffect } from 'react'

export const useUserProfile = () => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()

  const { data: profile, isLoading: profileIsLoading } = useQuery({
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

  return {
    profile,
    profileIsLoading,
  }
}
