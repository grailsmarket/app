import { claimPoap } from '@/api/user/claimPoap'
import { useUserContext } from '@/context/user'
import { useQuery } from '@tanstack/react-query'

export const usePoap = () => {
  const { userAddress } = useUserContext()

  const { data: poapLink, isLoading: poapLoading } = useQuery({
    queryKey: ['poap', userAddress],
    queryFn: async () => {
      if (!userAddress) return null

      const data = await claimPoap()
      return data
    },
    enabled: !!userAddress,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  return { poapLink, poapLoading }
}
