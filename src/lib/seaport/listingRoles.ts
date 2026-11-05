import type { Address, Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem'
import { REGISTRY_V2_ABI } from '@/constants/web3/abi/RegistryV2'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { readRoleHistory, readRoleSnapshot } from '@/utils/records/v2Roles'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { checkEnsV2Transferable } from './ensv2'

export type ListingRoleRemoval = {
  name: string
  tokenId: string
  resource: bigint
  account: Address
  bitmap: bigint
}

export type ListingRoleProgress = {
  phase: 'checking' | 'wallet' | 'pending' | 'done'
  total: number
  completed: number
  hash: Hex | null
  hashes: Hex[]
}

const registry = { address: config.ensV2Registry, abi: REGISTRY_V2_ABI } as const

export const readListingRoleRemovals = async (
  client: PublicClient,
  names: { name: string; tokenId: string }[],
  owner: Address,
  signal?: AbortSignal
): Promise<ListingRoleRemoval[]> => {
  if (!names.length) return []

  const blockNumber = await client.getBlockNumber({ cacheTime: 0 })
  const checks = await checkEnsV2Transferable(client, names, owner, blockNumber)
  const unavailable = checks.find((check) => !check.ok && check.reason !== 'blocking_roles')

  if (unavailable && !unavailable.ok) throw new Error(unavailable.message)

  const removals = await Promise.all(
    names.map(async (name, index) => {
      if (checks[index].ok) return []

      signal?.throwIfAborted()

      // The permission resource stays stable when revoking roles regenerates the token.
      const resource = await client.readContract({
        ...registry,
        functionName: 'getResource',
        args: [checks[index].tokenId],
        blockNumber,
      })
      const snapshot = await readRoleSnapshot(client, registry.address, resource, 'name', owner, blockNumber)
      const assignments = await readRoleHistory(client, snapshot, signal)

      // History contains direct grants. roles() can also include operator permissions, which must not be revoked.
      const blocking = assignments.filter(
        (assignment) =>
          assignment.resource === resource &&
          assignment.account.toLowerCase() !== owner.toLowerCase() &&
          assignment.bitmap !== BigInt(0)
      )
      if (!blocking.length) throw new Error(`Could not identify the blocking roles on ${name.name}. Check again.`)

      return blocking.map(({ account, bitmap }) => ({ ...name, resource, account, bitmap }))
    })
  )
  return removals.flat()
}

/** Recheck registration and authority before every write, including retries after partial completion. */
export const prepareListingRoleRemoval = async (client: PublicClient, removal: ListingRoleRemoval, owner: Address) => {
  if (removal.resource === BigInt(0) || removal.account.toLowerCase() === owner.toLowerCase())
    throw new Error('Only other accounts’ roles on this name can be removed when listing.')

  const state = await client.readContract({
    ...registry,
    functionName: 'getState',
    args: [BigInt(removal.tokenId)],
  })

  if (
    state.status !== 2 ||
    state.resource !== removal.resource ||
    state.latestOwner.toLowerCase() !== owner.toLowerCase()
  )
    throw new Error(`${removal.name}’s ownership or registration changed. Review the listing again.`)

  return client.simulateContract({
    ...registry,
    functionName: 'revokeRoles',
    args: [removal.resource, removal.bitmap, removal.account],
    account: owner,
  })
}

export type ListingRoleRemovalState = { pending: Hex | null }

export const removeListingRoles = async ({
  client,
  wallet,
  owner,
  names,
  removals,
  state,
  onProgress,
  onConfirmed,
}: {
  client: PublicClient
  wallet: WalletClient
  owner: Address
  names: { name: string; tokenId: string }[]
  removals: ListingRoleRemoval[]
  state: ListingRoleRemovalState
  onProgress: (progress: ListingRoleProgress) => void
  onConfirmed: (receipt: TransactionReceipt) => void
}) => {
  if (wallet.account?.address.toLowerCase() !== owner.toLowerCase())
    throw new Error('The connected wallet changed. Review the listing again.')

  let progress: ListingRoleProgress = {
    phase: 'checking',
    total: removals.length + (state.pending ? 1 : 0),
    completed: 0,
    hash: null,
    hashes: [],
  }

  const update = (next: Partial<ListingRoleProgress>) => {
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
  // Keep a submitted hash after a receipt timeout so retrying waits instead of submitting it twice.
  await confirmPending()
  const checks = await checkEnsV2Transferable(client, names, owner)
  const unavailable = checks.find((check) => !check.ok && check.reason !== 'blocking_roles')
  if (unavailable && !unavailable.ok) throw new Error(unavailable.message)
  // Validate the whole batch before requesting the first signature; skip previously confirmed removals.
  const prepared = await Promise.all(removals.map((removal) => prepareListingRoleRemoval(client, removal, owner)))
  const remaining = removals.filter((_, index) => prepared[index].result)

  update({ total: progress.completed + remaining.length })

  for (const removal of remaining) {
    const { request, result } = await prepareListingRoleRemoval(client, removal, owner)
    if (!result) {
      update({ total: progress.total - 1 })
      continue
    }

    update({ phase: 'wallet' })
    state.pending = await wallet.writeContract({ ...request, account: wallet.account, chain: activeChain })
    await confirmPending()
  }

  // The listing can proceed only once all names pass the onchain transfer check again.
  const finalChecks = await checkEnsV2Transferable(client, names, owner)
  const blocked = finalChecks.find((check) => !check.ok)

  if (blocked && !blocked.ok) throw new Error(blocked.message)

  update({ phase: 'done' })
}
