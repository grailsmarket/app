import { useQuery } from '@tanstack/react-query'
import { sepolia } from 'wagmi/chains'
import { getEnsV2 } from '@/utils/web3/ensv2'
import { createPublicClient, http } from 'viem'

export const useEnsV2 = () => {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  })

  const { data } = useQuery({
    queryKey: ['ensV2'],
    queryFn: () => getEnsV2(publicClient!),
    enabled: !!publicClient,
    staleTime: 60_000,
  })
  return data ?? null
}
