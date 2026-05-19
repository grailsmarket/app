'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchAccount } from 'ethereum-identity-kit'
import { isAddress } from 'viem'
import { useDebounce } from '@/hooks/useDebounce'

export const useOwnerAddressLookup = (ownerInput: string) => {
  const debouncedOwnerInput = useDebounce(ownerInput.trim(), 350)
  const query = useQuery({
    queryKey: ['comments', 'feed', 'owner', debouncedOwnerInput],
    queryFn: async () => {
      if (!debouncedOwnerInput) return null

      const account = await fetchAccount(debouncedOwnerInput)

      return {
        address: account?.address,
        ensName: account?.ens?.name,
      }
    },
    enabled: debouncedOwnerInput.length > 0,
    retry: false,
  })

  const ownerAddress = query.data?.address
  const ownerEnsName = query.data?.ensName
  const oppositeIdentifier = isAddress(ownerInput) ? (ownerEnsName ?? undefined) : (ownerAddress ?? undefined)
  const ownerError = debouncedOwnerInput.length > 0 && query.isError ? 'Enter a valid ENS name or address' : null

  return { ownerAddress, ownerEnsName, oppositeIdentifier, ownerError, debouncedOwnerInput }
}
