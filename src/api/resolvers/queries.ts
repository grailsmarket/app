import { queryOptions } from '@tanstack/react-query'
import type { Address } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import type { RecordConfiguration } from '@/types/ens'
import { getENSName, getResolver, getResolverRecords } from './client'

export const resolverQueryOptions = (resolver: Address) =>
  queryOptions({
    queryKey: ['settings', 'resolver', activeChain.id, resolver],
    queryFn: ({ signal }) => getResolver(resolver, signal),
    retry: false,
    staleTime: 30_000,
  })

export const configurationsQueryOptions = (resolver: Address) =>
  queryOptions({
    queryKey: ['settings', 'configurations', activeChain.id, resolver],
    queryFn: async ({ signal }) => {
      const records: RecordConfiguration[] = []
      let offset = 0

      while (true) {
        const page = await getResolverRecords({ resolver, limit: 500, offset, signal })
        records.push(...page.records)
        offset += page.limit

        if (offset >= page.record_count) return { ...page, records }
        if (!page.records.length) throw new Error('The configuration API returned an incomplete page.')
        signal.throwIfAborted()
      }
    },
    retry: false,
    staleTime: 30_000,
  })

export const ensNameQueryOptions = (name: string) =>
  queryOptions({
    queryKey: ['settings', 'ens-name', activeChain.id, name],
    queryFn: ({ signal }) => getENSName(name, signal),
    retry: false,
    staleTime: 30_000,
  })
