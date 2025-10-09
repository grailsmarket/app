import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'

export const useUserProfile = () => {
  const { address } = useAccount()

  const { data: profile, isLoading: profileIsLoading } = useQuery({
    queryKey: ['profile', address],
    queryFn: async () => {
      if (!address) return null

      const profile = await fetchAccount(address)
      return profile
    },
    enabled: !!address,
  })

  return {
    profile,
    profileIsLoading,
  }
}
