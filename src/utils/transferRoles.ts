import type { Address, Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { activeChain } from '@/constants/web3/chain'
import { normalizeName } from '@/lib/ens'
import type { TransferEntry } from '@/types/transfer'
import { readRoleHistory, readRoleSnapshot } from './records/v2Roles'
import { waitForTransaction } from './web3/safeTransaction'

export type TransferRoleRemoval = {
  name: string
  registry: Address
  tokenId: string
  resource: bigint
  account: Address
  bitmap: bigint
}

export type TransferRoleProgress = {
  phase: 'checking' | 'wallet' | 'pending' | 'done'
  total: number
  completed: number
  hash: Hex | null
  hashes: Hex[]
}

export type TransferRoleRemovalState = { pending: Hex | null }

const TRANSFER_ADMIN_ROLE = BigInt(1) << BigInt(156)
const ALL_ROLES = BigInt('0x1111111111111111111111111111111111111111111111111111111111111111')

/** Entries come from prepareBatches, which resolves each name's current registry. */
const checkTransferRoles = async (
  client: PublicClient,
  entries: TransferEntry[],
  owner: Address,
  blockNumber?: bigint
) =>
  Promise.all(
    entries
      .filter((entry) => entry.domain.version === 2)
      .map(async (entry) => {
        const contract = { address: entry.token, abi: REGISTRY_V2_ABI, blockNumber } as const
        const state = await client.readContract({
          ...contract,
          functionName: 'getState',
          args: [entry.tokenId],
        })

        if (state.status !== 2 || state.latestOwner.toLowerCase() !== owner.toLowerCase())
          throw new Error(`${entry.domain.name}’s ownership or registration changed. Review the transfer again.`)

        const [emancipated, canTransfer, onlyAssignee] = await Promise.all([
          client.readContract({ ...contract, functionName: 'isEmancipated' }),
          client.readContract({
            ...contract,
            functionName: 'hasRoles',
            args: [state.tokenId, TRANSFER_ADMIN_ROLE, owner],
          }),
          client.readContract({
            ...contract,
            functionName: 'isOnlyAssignee',
            args: [state.tokenId, ALL_ROLES, owner],
          }),
        ])

        if (!emancipated) throw new Error(`${entry.domain.name}’s registry does not allow safe transfers yet.`)
        if (!canTransfer) throw new Error(`Your wallet no longer has permission to transfer ${entry.domain.name}.`)

        return { entry, state, onlyAssignee }
      })
  )

export const readTransferRoleRemovals = async (
  client: PublicClient,
  entries: TransferEntry[],
  owner: Address,
  signal?: AbortSignal
): Promise<TransferRoleRemoval[]> => {
  if (!entries.some((entry) => entry.domain.version === 2)) return []

  signal?.throwIfAborted()
  const blockNumber = await client.getBlockNumber({ cacheTime: 0 })
  const checks = await checkTransferRoles(client, entries, owner, blockNumber)
  const removals = await Promise.all(
    checks.map(async ({ entry, state, onlyAssignee }) => {
      if (onlyAssignee) return []
      signal?.throwIfAborted()

      const snapshot = await readRoleSnapshot(client, entry.token, state.resource, 'name', owner, blockNumber)
      const assignments = await readRoleHistory(client, snapshot, signal)
      // History distinguishes direct grants from inherited registry and approved-operator access.
      const blocking = assignments.filter(
        (assignment) =>
          assignment.resource === state.resource &&
          assignment.account.toLowerCase() !== owner.toLowerCase() &&
          assignment.bitmap !== BigInt(0)
      )
      if (!blocking.length)
        throw new Error(`Could not identify the blocking roles on ${entry.domain.name}. Check again.`)

      return blocking.map(({ account, bitmap }) => ({
        name: entry.domain.name,
        registry: entry.token,
        tokenId: state.tokenId.toString(),
        resource: state.resource,
        account,
        bitmap,
      }))
    })
  )
  return removals.flat()
}

const prepareTransferRoleRemoval = async (
  client: PublicClient,
  entries: TransferEntry[],
  removal: TransferRoleRemoval,
  owner: Address
) => {
  if (removal.resource === BigInt(0) || removal.account.toLowerCase() === owner.toLowerCase())
    throw new Error('Only other accounts’ roles on this name can be removed when transferring.')

  const entry = entries.find(
    (entry) => entry.domain.version === 2 && normalizeName(entry.domain.name) === normalizeName(removal.name)
  )
  if (!entry || entry.token.toLowerCase() !== removal.registry.toLowerCase())
    throw new Error(`${removal.name}’s registry changed. Review the transfer again.`)

  const contract = { address: removal.registry, abi: REGISTRY_V2_ABI } as const
  const state = await client.readContract({
    ...contract,
    functionName: 'getState',
    args: [entry.tokenId],
  })

  if (
    state.status !== 2 ||
    state.resource !== removal.resource ||
    state.latestOwner.toLowerCase() !== owner.toLowerCase()
  )
    throw new Error(`${removal.name}’s ownership or registration changed. Review the transfer again.`)

  return client.simulateContract({
    ...contract,
    functionName: 'revokeRoles',
    args: [removal.resource, removal.bitmap, removal.account],
    account: owner,
  })
}

export const removeTransferRoles = async ({
  client,
  wallet,
  owner,
  prepareEntries,
  removals,
  state,
  onProgress,
  onConfirmed,
}: {
  client: PublicClient
  wallet: WalletClient
  owner: Address
  prepareEntries: () => Promise<TransferEntry[]>
  removals: TransferRoleRemoval[]
  state: TransferRoleRemovalState
  onProgress: (progress: TransferRoleProgress) => void
  onConfirmed: (receipt: TransactionReceipt) => void
}) => {
  if (wallet.account?.address.toLowerCase() !== owner.toLowerCase())
    throw new Error('Reconnect the wallet that started this transfer.')

  let progress: TransferRoleProgress = {
    phase: 'checking',
    total: removals.length + (state.pending ? 1 : 0),
    completed: 0,
    hash: null,
    hashes: [],
  }
  const update = (next: Partial<TransferRoleProgress>) => {
    progress = { ...progress, ...next }
    onProgress(progress)
  }
  const confirmPending = async () => {
    if (!state.pending) return

    update({ phase: 'pending', hash: state.pending })
    const receipt = await waitForTransaction(client, state.pending)
    state.pending = null
    if (receipt.status !== 'success') throw new Error('The role removal transaction reverted. Please try again.')

    update({
      phase: 'checking',
      completed: progress.completed + 1,
      hash: null,
      hashes: [...progress.hashes, receipt.transactionHash],
    })
    onConfirmed(receipt)
  }

  update({})
  // A receipt timeout retains the submitted hash. Retrying confirms it before making another write.
  await confirmPending()
  const entries = await prepareEntries()
  await checkTransferRoles(client, entries, owner)
  // Validate every approved removal before requesting the first signature; confirmed removals are no-ops.
  const prepared = await Promise.all(
    removals.map((removal) => prepareTransferRoleRemoval(client, entries, removal, owner))
  )
  const remaining = removals.filter((_, index) => prepared[index].result)
  update({ total: progress.completed + remaining.length })

  for (const removal of remaining) {
    const freshEntries = await prepareEntries()
    const { request, result } = await prepareTransferRoleRemoval(client, freshEntries, removal, owner)
    if (!result) {
      update({ total: progress.total - 1 })
      continue
    }

    update({ phase: 'wallet' })
    state.pending = await wallet.writeContract({ ...request, account: wallet.account, chain: activeChain })
    await confirmPending()
  }

  // Never broaden the approved bitmaps to remove a role granted after the user's review.
  const checks = await checkTransferRoles(client, await prepareEntries(), owner)
  const blocked = checks.find((check) => !check.onlyAssignee)
  if (blocked)
    throw new Error(`Another account still has permissions on ${blocked.entry.domain.name}. Review its roles again.`)

  update({ phase: 'done' })
}
