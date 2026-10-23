import { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address } from 'viem'
import { normalize } from 'viem/ens'
import { activeChain } from '@/constants/web3/chain'
import { fetchOwnedNames } from '@/api/user/ownedNames'
import { useDebounce } from '@/hooks/useDebounce'
import { createV2RecordsClient } from '@/utils/records/client'
import { verifyPrimaryNameOwner, type PrimaryNameOption } from '@/utils/settings/primaryName'
import { readNameResolver } from '@/utils/records/v2Resolver'
import { config } from '@/lib/config'

export const useOwnedNameOptions = (address: Address, excludeResolver?: Address) => {
  const queries = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search.trim(), 250)
  const client = useMemo(createV2RecordsClient, [])
  const names = useInfiniteQuery({
    queryKey: ['settings', 'owned-name-options', activeChain.id, address, debouncedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchOwnedNames({ address, search: debouncedSearch, page: pageParam, signal }),
    getNextPageParam: (last) => last.nextPage,
    retry: false,
  })

  let exactName: string | null = null

  try {
    if (debouncedSearch.includes('.')) exactName = normalize(debouncedSearch)
  } catch {
    // Partial names can still match API results.
  }

  const exact = useQuery({
    queryKey: ['settings', 'owned-name-exact', activeChain.id, address, exactName],
    queryFn: async () => {
      const option: PrimaryNameOption = { name: exactName!, version: 2, token_id: '', expiry_date: null }

      await verifyPrimaryNameOwner(client, option, address, queries)

      return option
    },
    enabled: !!exactName,
    retry: false,
  })
  const options = new Map<string, PrimaryNameOption>()

  if (search.trim() === debouncedSearch) {
    for (const option of names.data?.pages.flatMap((page) => page.names) ?? []) {
      if (option.version === 2) options.set(option.name, { ...option, version: 2 })
    }

    if (exact.data && !options.has(exact.data.name)) options.set(exact.data.name, exact.data)
  }

  const candidates = [...options.keys()]
  const exclusions = useQuery({
    queryKey: ['settings', 'owned-name-resolvers', activeChain.id, address, excludeResolver, candidates],
    enabled: !!excludeResolver && candidates.length > 0,
    retry: false,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const excluded: string[] = []

      // Used only when the names API is unavailable or cannot list all resolver members.
      for (let offset = 0; offset < candidates.length; offset += 5) {
        signal.throwIfAborted()
        const batch = candidates.slice(offset, offset + 5)
        const bindings = await Promise.all(batch.map((name) => readNameResolver(client, name, config.ensV2Registry)))

        for (const [index, binding] of bindings.entries()) {
          if (!binding.registered || binding.resolver.toLowerCase() === excludeResolver!.toLowerCase())
            excluded.push(batch[index])
        }
      }

      return excluded
    },
  })
  const filtering = !!excludeResolver && candidates.length > 0 && exclusions.isPending
  const excludedNames = excludeResolver ? (exclusions.data ?? []) : []
  const available = [...options.values()].filter((option) => !excludedNames.includes(option.name))

  return {
    search,
    setSearch,
    names,
    exclusions,
    excludedNames,
    filtering,
    options: excludeResolver && !exclusions.data ? [] : available,
    searching: search.trim() !== debouncedSearch || names.isFetching || exact.isFetching || filtering,
  }
}
