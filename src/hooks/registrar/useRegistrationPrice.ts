import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { labelhash, zeroAddress } from 'viem'
import { ENS_V2_REGISTRAR } from '@/constants/web3/abi/RegistrarV2'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { activeChain } from '@/constants/web3/chain'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
import { config } from '@/lib/config'
import { normalizeName } from '@/lib/ens'
import { GRACE_PERIOD, PREMIUM, REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'

const ONE_YEAR_SECONDS = BigInt(365 * 24 * 60 * 60)

export const useRegistrationPrice = (name: string | undefined, enabled: boolean) => {
  const publicClient = usePublicClient({ chainId: activeChain.id })

  return useQuery({
    queryKey: ['rentPrice', activeChain.id, config.ensV2Registrar, config.ensV2Registry, TOKEN_ADDRESSES.USDC, name],
    queryFn: async () => {
      if (!publicClient || !name) throw new Error('Registration pricing is not available yet.')

      const label = normalizeName(name).replace(/\.eth$/, '')
      if (!name.endsWith('.eth') || label.includes('.') || /^\[[0-9a-f]{64}\]$/i.test(label))
        throw new Error('The full .eth name is required to check registration pricing.')

      // Read availability, expiry, and price at the same block so a registration cannot race the quote.
      const blockNumber = await publicClient.getBlockNumber({ cacheTime: 0 })
      const [isAvailable, state] = await publicClient.multicall({
        allowFailure: false,
        blockNumber,
        contracts: [
          {
            address: config.ensV2Registrar,
            abi: ENS_V2_REGISTRAR,
            functionName: 'isAvailable',
            args: [label],
          },
          {
            address: config.ensV2Registry,
            abi: REGISTRY_V2_ABI,
            functionName: 'getState',
            args: [BigInt(labelhash(label))],
          },
        ],
      })
      const expiryDate = state.expiry > BigInt(0) ? new Date(Number(state.expiry) * 1000).toISOString() : null

      if (!isAvailable) {
        return {
          isAvailable: false,
          isReserved: state.latestOwner === zeroAddress,
          status: state.status === 0 ? GRACE_PERIOD : REGISTERED,
          expiryDate,
          base: null,
          premium: null,
        } as const
      }

      const [base, premium] = await publicClient.readContract({
        address: config.ensV2Registrar,
        abi: ENS_V2_REGISTRAR,
        functionName: 'getRegisterPrice',
        args: [label, ONE_YEAR_SECONDS, TOKEN_ADDRESSES.USDC],
        blockNumber,
      })

      return {
        isAvailable: true,
        status: premium > BigInt(0) ? PREMIUM : UNREGISTERED,
        expiryDate,
        base,
        premium,
      } as const
    },
    enabled: enabled && !!publicClient && !!name,
    refetchInterval: (query) => (query.state.data?.isAvailable ? 10000 : 60000),
    refetchOnWindowFocus: true,
    staleTime: 5000,
  })
}
