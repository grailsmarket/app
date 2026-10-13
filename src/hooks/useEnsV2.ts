import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { activeChain } from '@/constants/web3/chain'
import { getEnsV2 } from '@/utils/web3/ensv2'

export const useEnsV2Status = () => {
  const publicClient = usePublicClient({ chainId: activeChain.id })
  return useQuery({
    queryKey: ['ensV2', activeChain.id],
    queryFn: () => getEnsV2(publicClient!),
    enabled: !!publicClient,
    staleTime: 60_000,
  })
}

export const useEnsV2 = () => useEnsV2Status().data ?? null
