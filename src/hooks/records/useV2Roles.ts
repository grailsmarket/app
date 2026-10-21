import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BaseError, type Address, type Hex, zeroAddress } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { createV2RecordsClient } from '@/utils/records/client'
import { readNameResolver } from '@/utils/records/v2Resolver'
import {
  adminRole,
  hasRole,
  prepareRoleChange,
  readRoleAccess,
  readRoleHistory,
  readRoleSnapshot,
  roleChangeDetails,
  type RoleChange,
  type RoleKind,
  type RoleAssignment,
} from '@/utils/records/v2Roles'
import {
  buildRoleTransactions,
  removeConfirmedRoleDrafts,
  roleChangeKey,
  updateRoleDraft,
  type RoleDrafts,
  type RoleTransactionBatch,
} from '@/utils/records/v2RoleDrafts'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

export const roleErrorText = (error: unknown) =>
  error instanceof BaseError
    ? error.shortMessage
    : error instanceof Error
      ? error.message
      : 'Could not load permissions.'

export const useRoleSection = (kind: RoleKind, contract?: Address, resource = BigInt(0), enabled = true) => {
  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  const snapshot = useQuery({
    queryKey: ['v2-roles', 'snapshot', activeChain.id, kind, contract, resource.toString(), address],
    queryFn: () => readRoleSnapshot(client, contract!, resource, kind, address),
    enabled: enabled && !!contract && contract !== zeroAddress,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const history = useQuery({
    queryKey: [
      'v2-roles',
      'history',
      activeChain.id,
      kind,
      contract,
      resource.toString(),
      snapshot.data?.blockNumber.toString(),
    ],
    queryFn: ({ signal }) => readRoleHistory(client, snapshot.data!, signal),
    enabled: enabled && !!snapshot.data,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  })
  return { snapshot, history, assignments: history.data ?? snapshot.data?.initialAssignments ?? [] }
}

export const useV2Roles = (name: string, enabled = true) => {
  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  const binding = useQuery({
    queryKey: ['v2-records', 'name', activeChain.id, config.ensV2Registry, name, address],
    queryFn: () => readNameResolver(client, name, config.ensV2Registry, address),
    enabled,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const nameRoles = useRoleSection(
    'name',
    binding.data?.registry,
    binding.data?.resource,
    enabled && !!binding.data?.registered
  )
  const resolverRoles = useRoleSection('resolver', binding.data?.resolver, BigInt(0), enabled)
  return { binding, nameRoles, resolverRoles, address }
}

export type V2RolesData = ReturnType<typeof useV2Roles>

export const useV2RoleAuthority = (change?: RoleChange) => {
  const { address } = useAccount()
  const client = useMemo(createV2RecordsClient, [])
  let details: ReturnType<typeof roleChangeDetails> | undefined
  let validationError: string | undefined
  if (change) {
    try {
      details = roleChangeDetails(change)
    } catch (error) {
      validationError = roleErrorText(error)
    }
  }
  const access = useQuery({
    queryKey: [
      'v2-roles',
      'authority',
      activeChain.id,
      change?.contract,
      details?.resource.toString(),
      address,
      change?.account.toLowerCase(),
    ],
    queryFn: async () => {
      const [viewer, target] = await Promise.all([
        readRoleAccess(client, change!.contract, details!.resource, address!),
        readRoleAccess(client, change!.contract, details!.resource, change!.account as Address),
      ])
      return { ...viewer, target }
    },
    enabled: !!address && !!details,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  return {
    validationError,
    error: access.error ? roleErrorText(access.error) : undefined,
    loading: !!details && !!address && access.isPending,
    allowed: !!details && !!access.data && hasRole(access.data.effective, adminRole(details.role.bit)),
    targetHasRole: details && access.data ? hasRole(access.data.target.effective, details.bitmap) : undefined,
    retry: access.refetch,
  }
}

export const useV2RoleEditor = (name: string, enabled: boolean) => {
  const data = useV2Roles(name, enabled)
  const editor = useRoleDraftEditor(data.address)
  return { ...editor, data }
}

export const useRoleDraftEditor = (address?: Address) => {
  const [drafts, setDrafts] = useState<RoleDrafts>({})
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({})
  const [accounts, setAccounts] = useState<Record<string, (RoleAssignment & { roleId?: string })[]>>({})
  const draftWallet = useRef<Address | undefined>(undefined)
  const initial = (change: RoleChange, value: boolean) => {
    const key = roleChangeKey(change)
    return drafts[key]?.initial ?? confirmed[key] ?? value
  }
  const checked = (change: RoleChange, value: boolean) =>
    drafts[roleChangeKey(change)]?.current ?? initial(change, value)
  const toggle = (change: RoleChange, value: boolean, next: boolean) => {
    if (!Object.keys(drafts).length) draftWallet.current = address
    setDrafts((previous) => updateRoleDraft(previous, change, initial(change, value), next))
  }
  const onConfirmed = (changes: RoleChange[]) => {
    setConfirmed((previous) => ({
      ...previous,
      ...Object.fromEntries(changes.map((change) => [roleChangeKey(change), change.action === 'grant'])),
    }))
    setDrafts((previous) => removeConfirmedRoleDrafts(previous, changes))
  }
  const changes = Object.values(drafts).map((draft) => draft.change)
  return {
    accounts,
    addAccount: (key: string, assignment: RoleAssignment & { roleId?: string }) =>
      setAccounts((previous) => ({
        ...previous,
        [key]: [
          ...(previous[key] ?? []).filter(
            (item) =>
              item.resource !== assignment.resource ||
              item.account.toLowerCase() !== assignment.account.toLowerCase() ||
              item.roleId !== assignment.roleId
          ),
          assignment,
        ],
      })),
    changes,
    initial,
    checked,
    toggle,
    onConfirmed,
    hasChanges: changes.length > 0,
    walletChanged: changes.length > 0 && draftWallet.current?.toLowerCase() !== address?.toLowerCase(),
    reset: () => setDrafts({}),
  }
}

export type V2RoleEditor = ReturnType<typeof useV2RoleEditor>
export type RoleDraftEditor = ReturnType<typeof useRoleDraftEditor>
export type RoleSectionData = ReturnType<typeof useRoleSection>

export const useV2RoleTransaction = (name: string | null, onConfirmed: (changes: RoleChange[]) => void) => {
  const { address } = useAccount()
  const getWalletClient = useGetWalletClient()
  const client = useMemo(createV2RecordsClient, [])
  const queryClient = useQueryClient()
  const locked = useRef(false)
  type PendingBatch = { hash: Hex; batch: RoleTransactionBatch }
  const pendingRef = useRef<PendingBatch | null>(null)
  const [pending, setPending] = useState<PendingBatch | null>(null)
  const [hash, setHash] = useState<Hex | null>(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [step, setStep] = useState<'editing' | 'confirming' | 'processing' | 'success' | 'error'>('editing')
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    const write = pendingRef.current
    if (!write) return []
    setStep('processing')
    const receipt = await waitForTransaction(client, write.hash)
    pendingRef.current = null
    setPending(null)
    if (receipt.status !== 'success')
      throw new Error('The transaction reverted. Its permission changes have not been saved.')
    setHash(receipt.transactionHash)
    onConfirmed(write.batch.changes)
    void queryClient.invalidateQueries({ queryKey: ['settings'] })
    // Registry role changes regenerate token IDs; records also need fresh permission checks.
    for (const key of [['v2-roles'], ['v2-records'], ['name'], ['profile'], ['user', 'resolvers']])
      void queryClient.invalidateQueries({ queryKey: key })
    return write.batch.changes
  }

  const submit = async (changes: RoleChange[]) => {
    if (locked.current) return
    locked.current = true
    setError(null)
    try {
      let remaining = changes
      if (pendingRef.current) {
        const completed = new Set((await confirm()).map(roleChangeKey))
        remaining = remaining.filter((change) => !completed.has(roleChangeKey(change)))
      }
      if (!remaining.length) {
        setStep('success')
        return
      }
      setHash(null)
      setStep('confirming')
      const wallet = await getWalletClient()
      if (!address || wallet.account.address.toLowerCase() !== address.toLowerCase())
        throw new Error('The connected wallet changed. Reopen the role editor.')
      await ensureChain(wallet, activeChain.id)
      const batches = buildRoleTransactions(remaining, address)
      // Fail invalid drafts before sending the first transaction. Each batch is checked again immediately before signing.
      await Promise.all(
        remaining.map((change) => prepareRoleChange(client, name, config.ensV2Registry, address, change))
      )
      for (const [index, batch] of batches.entries()) {
        setProgress({ current: index + 1, total: batches.length })
        setStep('confirming')
        await Promise.all(
          batch.changes.map((change) => prepareRoleChange(client, name, config.ensV2Registry, address, change))
        )
        await client.call({ account: address, to: batch.contract, data: batch.data })
        const submitted = await wallet.sendTransaction({
          account: wallet.account,
          to: batch.contract,
          data: batch.data,
          chain: activeChain,
        })
        pendingRef.current = { hash: submitted, batch }
        setPending(pendingRef.current)
        setHash(submitted)
        await confirm()
      }
      setStep('success')
    } catch (error) {
      setError(roleErrorText(error))
      setStep('error')
    } finally {
      locked.current = false
    }
  }

  return {
    submit,
    step,
    error,
    pending,
    progress,
    busy: step === 'confirming' || step === 'processing',
    explorerUrl: hash ? `${activeChain.blockExplorers.default.url}/tx/${hash}` : null,
  }
}

export type V2RoleTransaction = ReturnType<typeof useV2RoleTransaction>
