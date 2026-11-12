import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Address, Hex, PublicClient } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { config } from '@/lib/config'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'
import type { TransferBatch } from '@/types/transfer'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import { getTransferDomainKey } from '@/utils/transfer'
import {
  readTransferRoleRemovals,
  removeTransferRoles,
  type TransferRoleProgress,
  type TransferRoleRemovalState,
} from '@/utils/transferRoles'
import { ensureChain } from '@/utils/web3/ensureChain'

export const useTransferRoleRemoval = (
  domains: TransferDomainType[],
  owner: Address | undefined,
  reviewing: boolean,
  client: PublicClient,
  prepareBatches: (domains: TransferDomainType[], sender: Address) => Promise<TransferBatch[]>
) => {
  const [consent, setConsent] = useState<string | null>(null)
  const [progress, setProgress] = useState<TransferRoleProgress | null>(null)

  const [pendingHash, setPendingHash] = useState<Hex | null>(null)
  const transaction = useRef<TransferRoleRemovalState>({ pending: null })
  const confirmedHashes = useRef<Hex[]>([])
  const queries = useQueryClient()
  const getWalletClient = useGetWalletClient()
  const names = domains.filter((domain) => domain.version === 2)
  const prepareEntries = async () => (await prepareBatches(names, owner!)).flatMap((batch) => batch.entries)

  const query = useQuery({
    queryKey: ['v2-roles', 'transfer', activeChain.id, config.ensV2Registry, owner, names.map(getTransferDomainKey)],
    queryFn: async ({ signal }) => readTransferRoleRemovals(client, await prepareEntries(), owner!, signal),
    enabled: reviewing && names.length > 0 && !!owner,
    retry: false,
    refetchOnWindowFocus: false,
    structuralSharing: false,
  })
  const removals = query.data ?? []
  // Consent covers the exact grants reviewed, not new accounts or roles discovered later.
  const consentKey = JSON.stringify([
    owner?.toLowerCase(),
    names.map(getTransferDomainKey),
    removals.map(({ registry, resource, account, bitmap }) => [
      registry.toLowerCase(),
      resource.toString(),
      account.toLowerCase(),
      bitmap.toString(),
    ]),
  ])
  const acknowledged = consent === consentKey
  const ready = !names.length || (query.isSuccess && !query.isFetching && (!removals.length || acknowledged))

  const remove = async () => {
    if (!names.length) return
    if (!owner || (!transaction.current.pending && !ready))
      throw new Error('Review and confirm the blocking role removals before transferring.')

    const wallet = await getWalletClient()
    if (wallet.account.address.toLowerCase() !== owner.toLowerCase())
      throw new Error('Reconnect the wallet that started this transfer.')

    await ensureChain(wallet, activeChain.id)
    try {
      await removeTransferRoles({
        client,
        wallet,
        owner,
        prepareEntries,
        removals,
        state: transaction.current,
        onProgress: (next) => {
          setPendingHash(transaction.current.pending)
          setProgress({ ...next, hashes: [...new Set([...confirmedHashes.current, ...next.hashes])] })
        },
        onConfirmed: (receipt) => {
          confirmedHashes.current.push(receipt.transactionHash)
          refreshEnsQueries(queries, receipt)
        },
      })
    } finally {
      setPendingHash(transaction.current.pending)
    }
  }

  return {
    query,
    removals,
    progress,
    ready,
    acknowledged,
    setAcknowledged: (value: boolean) => setConsent(value ? consentKey : null),
    remove,
    pendingHash,
    getPendingHash: () => transaction.current.pending,
    resetProgress: () =>
      setProgress(
        confirmedHashes.current.length
          ? {
              phase: 'done',
              total: confirmedHashes.current.length,
              completed: confirmedHashes.current.length,
              hash: null,
              hashes: [...confirmedHashes.current],
            }
          : null
      ),
    hasV2Names: names.length > 0 && !!owner,
  }
}
