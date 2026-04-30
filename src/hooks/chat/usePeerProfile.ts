'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'
import { isAddress } from 'viem'
import { formatAddress } from '@/utils/formatAddress'

interface PeerProfile {
  address: string
  /** Primary ENS name if resolved, otherwise null. */
  ensName: string | null
  /** ENS avatar URL if any. */
  avatar: string | null
  /** Best display label: ENS name or shortened address. */
  displayLabel: string
}

/**
 * Cached lookup for a peer's ENS profile, shared via React Query so multiple
 * chat surfaces (inbox row + thread header) don't refetch the same address.
 *
 * Falls back to the formatted address when ENS resolution fails or returns no
 * primary name.
 */
export const usePeerProfile = (address: string | null | undefined): PeerProfile | null => {
  const lower = address ? address.toLowerCase() : null

  const query = useQuery({
    queryKey: ['account', lower],
    queryFn: async () => {
      if (!lower || !isAddress(lower)) return null
      return await fetchAccount(lower)
    },
    enabled: !!lower && !!address && isAddress(address),
    staleTime: 10 * 60 * 1000,
  })

  if (!address) return null

  const ensName = query.data?.ens?.name ?? null
  const avatar = query.data?.ens?.avatar ?? null

  return {
    address,
    ensName,
    avatar,
    displayLabel: ensName || formatAddress(address),
  }
}
