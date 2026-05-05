'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'
import { Address, isAddress } from 'viem'
import { formatAddress } from '@/utils/formatAddress'
import { beautifyName } from '@/lib/ens'

interface PeerProfile {
  address: Address
  ensName: string | null
  avatar: string | null
  displayLabel: string
  records: Record<string, string>
}

export const usePeerProfile = (address: Address | null | undefined): PeerProfile | null => {
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
  const records = query.data?.ens?.records ?? {}

  return {
    address,
    ensName,
    avatar,
    displayLabel: ensName ? beautifyName(ensName) : formatAddress(address),
    records,
  }
}
