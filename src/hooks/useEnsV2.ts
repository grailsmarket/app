import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { activeChain } from '@/constants/web3/chain'
import { getEnsV2 } from '@/utils/web3/ensv2'

export const useEnsV2 = () => {
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const { data } = useQuery({
    queryKey: ['ensV2'],
    queryFn: () => getEnsV2(publicClient!),
    // enabled: !!publicClient,
    staleTime: 60_000,
  })
  return data ?? null
}
