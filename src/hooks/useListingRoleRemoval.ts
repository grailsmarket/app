import { useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { activeChain } from '@/constants/web3/chain'
import { useUserContext } from '@/context/user'
import { config } from '@/lib/config'
import { isEnsV2Name } from '@/lib/seaport/ensv2'
import {
  removeListingRoles,
  readListingRoleRemovals,
  type ListingRoleProgress,
  type ListingRoleRemovalState,
} from '@/lib/seaport/listingRoles'
import type { MarketplaceDomainType } from '@/types/domains'
import { createV2RecordsClient } from '@/utils/records/client'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import { ensureChain } from '@/utils/web3/ensureChain'
import { useGetWalletClient } from './useGetWalletClient'

export const useListingRoleRemoval = (domains: MarketplaceDomainType[], reviewing: boolean) => {
  const [consent, setConsent] = useState<string | null>(null)
  const [progress, setProgress] = useState<ListingRoleProgress | null>(null)

  const { userAddress } = useUserContext()
  const queries = useQueryClient()
  const client = useMemo(createV2RecordsClient, [])
  const getWalletClient = useGetWalletClient()
  const names = domains.filter(isEnsV2Name).map((domain) => ({ name: domain.name, tokenId: domain.token_id }))
  const transaction = useRef<ListingRoleRemovalState>({ pending: null })

  const query = useQuery({
    queryKey: ['v2-roles', 'listing', activeChain.id, config.ensV2Registry, userAddress, names],
    queryFn: ({ signal }) => readListingRoleRemovals(client, names, userAddress!, signal),
    enabled: reviewing && names.length > 0 && !!userAddress,
    retry: false,
    refetchOnWindowFocus: false,
    structuralSharing: false,
  })
  const removals = query.data ?? []
  const consentKey = JSON.stringify([
    userAddress?.toLowerCase(),
    names,
    removals.map(({ resource, account, bitmap }) => [resource.toString(), account.toLowerCase(), bitmap.toString()]),
  ])
  const acknowledged = consent === consentKey
  const ready = !names.length || (query.isSuccess && !query.isFetching && (removals.length === 0 || acknowledged))

  const remove = async () => {
    if (!names.length) return
    if (!userAddress || !ready) throw new Error('Review and confirm the blocking role removals before listing.')

    setProgress(null)

    const wallet = await getWalletClient()
    if (wallet.account.address.toLowerCase() !== userAddress.toLowerCase())
      throw new Error('The connected wallet changed. Review the listing again.')

    await ensureChain(wallet, activeChain.id)
    await removeListingRoles({
      client,
      wallet,
      owner: userAddress,
      names,
      removals,
      state: transaction.current,
      onProgress: setProgress,
      onConfirmed: (receipt) => refreshEnsQueries(queries, receipt),
    })
  }

  return {
    query,
    removals,
    progress,
    ready,
    acknowledged,
    setAcknowledged: (value: boolean) => setConsent(value ? consentKey : null),
    remove,
    hasV2Names: names.length > 0,
  }
}
