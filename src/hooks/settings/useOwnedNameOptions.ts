import { useMemo, useState } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { normalize } from 'viem/ens'
import { activeChain } from '@/constants/web3/chain'
import { fetchOwnedNames } from '@/api/user/ownedNames'
import { useDebounce } from '@/hooks/useDebounce'
import { createV2RecordsClient } from '@/utils/records/client'
import { verifyPrimaryNameOwner, type PrimaryNameOption } from '@/utils/settings/primaryName'

export const useOwnedNameOptions = (address: Address) => {
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
    // Partial names can still match indexed results.
  }

  const exact = useQuery({
    queryKey: ['settings', 'owned-name-exact', activeChain.id, address, exactName],
    queryFn: async () => {
      const option: PrimaryNameOption = { name: exactName!, version: 2, token_id: '', expiry_date: null }

      await verifyPrimaryNameOwner(client, option, address)

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

  return {
    search,
    setSearch,
    names,
    options: [...options.values()],
    searching: search.trim() !== debouncedSearch || names.isFetching || exact.isFetching,
  }
}
