import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { readConfigurationNames } from '@/utils/settings/configurations'
import { useResolverCatalog } from './useResolverDirectory'

export const useConfigurationNames = (resolver: Address) => {
  const { address } = useAccount()
  const queries = useQueryClient()
  const candidateKey = ['settings', 'name-candidates', activeChain.id, resolver, address]
  const candidates = useQuery<string[]>({ queryKey: candidateKey, queryFn: () => [], enabled: false, initialData: [] })
  const data = useResolverCatalog(resolver)
  const names = useQuery({
    queryKey: [
      'settings',
      'configuration-names',
      activeChain.id,
      resolver,
      address,
      data.catalog?.blockNumber.toString(),
      data.catalog?.historyComplete,
      candidates.data,
    ],
    queryFn: ({ signal }) =>
      readConfigurationNames(
        data.client,
        resolver,
        data.catalog!,
        config.ensV2Registry,
        address,
        candidates.data,
        AbortSignal.any([signal, AbortSignal.timeout(25_000)])
      ),
    enabled: !!data.catalog,
    retry: false,
    staleTime: 30_000,
  })
  // A name using the default may never emit Linked. Keep names entered in this session and verify every
  // candidate against the current registry/resolver; these are not preferences or indexed name counts.
  const rememberNames = (names: string[]) =>
    queries.setQueryData<string[]>(candidateKey, (previous) => [...new Set([...(previous ?? []), ...names])])
  return { ...data, names, rememberNames }
}
