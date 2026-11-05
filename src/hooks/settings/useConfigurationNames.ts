import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { readConfigurationNames } from '@/utils/settings/configurations'
import { readResolverHistory, readResolverState } from '@/utils/records/v2Resolver'
import { useResolverCatalog } from './useResolverDirectory'
import { useResolverData } from './useResolverData'

export const useConfigurationNames = (resolver: Address, enabled = true) => {
  const { address } = useAccount()
  const queries = useQueryClient()
  const candidateKey = ['settings', 'name-candidates', activeChain.id, resolver, address]
  const candidates = useQuery<string[]>({ queryKey: candidateKey, queryFn: () => [], enabled: false, initialData: [] })
  const data = useResolverCatalog(resolver)
  const resolverData = useResolverData(resolver)
  const availableNames = resolverData.configurations.data?.records.flatMap((record) => record.names) ?? []

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
      availableNames,
    ],
    queryFn: async ({ signal }) => {
      const deadline = AbortSignal.any([signal, AbortSignal.timeout(45_000)])
      const state = await readResolverState(data.client, resolver, 'grails-settings.invalid', address)
      let catalog = state

      try {
        catalog = await readResolverHistory(data.client, resolver, state, deadline)
      } catch {
        signal.throwIfAborted()
        // Known API/session names remain usable if the RPC cannot retrieve the full history.
      }

      return readConfigurationNames(
        data.client,
        resolver,
        catalog,
        config.ensV2Registry,
        address,
        [...candidates.data, ...availableNames],
        AbortSignal.any([signal, AbortSignal.timeout(25_000)])
      )
    },
    enabled: enabled && !!data.catalog,
    retry: false,
    staleTime: 30_000,
  })
  // A name using the default may never emit Linked. Keep names entered in this session and verify every
  // candidate against the current registry/resolver when the API is unavailable.
  const rememberNames = (names: string[]) =>
    queries.setQueryData<string[]>(candidateKey, (previous) => [...new Set([...(previous ?? []), ...names])])
  return { ...data, names, rememberNames }
}
