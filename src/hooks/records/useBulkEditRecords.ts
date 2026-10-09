import { useState, useCallback, useMemo } from 'react'
import { type Hex, encodeFunctionData, isAddressEqual, toHex, zeroAddress } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { useAccount, usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { useEnsV2 } from '@/hooks/useEnsV2'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { PublicResolverAbi } from '@/constants/abi/PublicResolverAbi'
import { TEXT_RECORD_KEYS, ADDRESS_RECORD_KEYS, COIN_TYPES } from '@/constants/ens/records'
import { fetchNameRoles } from '@/api/name/roles'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForSuccess } from '@/utils/web3/safeTransaction'
import {
  type EnsRecord,
  type PlannedTx,
  ENS_V2_STATUS,
  encodeRecordCalls,
  getOwnedResolver,
  getV2Name,
  planRecordWrite,
  recordWriteTransactions,
} from '@/utils/web3/ensv2'

const MAX_NAMES_PER_MULTICALL = 50

export type BulkEditStep = 'loading_roles' | 'editing' | 'confirming' | 'processing' | 'success' | 'error'

export type BulkRecordSet = {
  textRecords: Record<string, string>
  addressRecords: Record<string, string>
  ethAddress: string
  contenthash: string
  customRecords: Record<string, string>
}

export type TransactionStatus = PlannedTx & {
  ordered: boolean
  status: 'pending' | 'confirming' | 'processing' | 'success' | 'error'
  txHash: string | null
  error: string | null
}

type ResolverGroup = {
  resolverAddress: `0x${string}`
  names: string[]
}

function createEmptyRecordSet(): BulkRecordSet {
  return {
    textRecords: {},
    addressRecords: {},
    ethAddress: '',
    contenthash: '',
    customRecords: {},
  }
}

function encodeContenthash(input: string): `0x${string}` {
  // Simple encoding: store as UTF-8 hex for protocol-prefixed URIs
  // In production you'd use content-hash library for proper IPFS/Arweave encoding
  if (!input) return '0x'
  return toHex(new TextEncoder().encode(input)) as `0x${string}`
}

export const buildRecords = (records: BulkRecordSet, customKeys: string[], clearedFields: Set<string>): EnsRecord[] => [
  ...TEXT_RECORD_KEYS.filter((key) => records.textRecords[key] || clearedFields.has(`text:${key}`)).map((key) => ({
    type: 'text' as const,
    key,
    value: records.textRecords[key] || '',
  })),
  ...[...new Set(customKeys)]
    .filter((key) => records.customRecords[key] || clearedFields.has(`custom:${key}`))
    .map((key) => ({ type: 'text' as const, key, value: records.customRecords[key] || '' })),
  ...ADDRESS_RECORD_KEYS.filter((key) => records.addressRecords[key] || clearedFields.has(`addr:${key}`)).map(
    (key) => ({
      type: 'addr' as const,
      coinType: COIN_TYPES[key],
      value: records.addressRecords[key]
        ? toHex(new TextEncoder().encode(records.addressRecords[key]))
        : ('0x' as const),
    })
  ),
  ...(records.ethAddress || clearedFields.has('ethAddress')
    ? [{ type: 'addr' as const, coinType: 60, value: (records.ethAddress || zeroAddress) as Hex }]
    : []),
  ...(records.contenthash || clearedFields.has('contenthash')
    ? [{ type: 'contenthash' as const, value: encodeContenthash(records.contenthash) }]
    : []),
]

export const runTransactions = async (
  statuses: Pick<TransactionStatus, 'ordered' | 'status'>[],
  start: number,
  end: number,
  send: (index: number) => Promise<boolean>
) => {
  const succeeded = statuses.map(({ status }) => status === 'success')
  for (let index = start; index < end; index++) {
    if (statuses[index].ordered && statuses.some((s, i) => i < index && s.ordered && !succeeded[i])) continue
    succeeded[index] = await send(index)
  }
  return succeeded
}

export function useBulkEditRecords(names: string[]) {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const getWalletClient = useGetWalletClient()
  const queryClient = useQueryClient()
  const ensV2 = useEnsV2()

  // Fetch roles for all names in parallel
  const rolesQueries = useQueries({
    queries: names.map((name) => ({
      queryKey: ['name', 'roles', name],
      queryFn: () => fetchNameRoles(name),
      enabled: !!name,
    })),
  })

  const v2Queries = useQueries({
    queries: names.map((name) => ({
      queryKey: ['name', 'v2', name],
      queryFn: () => (ensV2 && publicClient ? getV2Name(publicClient, ensV2, name) : null),
      enabled: !!ensV2 && !!name && !!publicClient,
    })),
  })

  const isLoadingRoles = rolesQueries.some((q) => q.isLoading) || v2Queries.some((q) => q.isLoading)

  const canEdit = useCallback(
    (index: number) => {
      if (!address) return false
      const v2Name = v2Queries[index]?.data
      if (v2Name) return v2Name.status === ENS_V2_STATUS.REGISTERED && isAddressEqual(v2Name.latestOwner, address)
      return rolesQueries[index]?.data?.manager.toLowerCase() === address.toLowerCase()
    },
    [address, v2Queries, rolesQueries]
  )

  // Names where user is the manager
  const managedNames = useMemo(() => names.filter((_, i) => canEdit(i)), [names, canEdit])

  // Names where user is NOT the manager
  const skippedNames = useMemo(() => names.filter((_, i) => !canEdit(i)), [names, canEdit])

  // Group names by resolver address
  const resolverGroups = useMemo((): ResolverGroup[] => {
    const groupMap = new Map<string, string[]>()

    names.forEach((name, i) => {
      const roles = rolesQueries[i]?.data
      if (!roles || v2Queries[i]?.data || !canEdit(i)) return

      const resolver = roles.resolver.toLowerCase()
      if (!groupMap.has(resolver)) {
        groupMap.set(resolver, [])
      }
      groupMap.get(resolver)!.push(name)
    })

    return Array.from(groupMap.entries()).map(([resolverAddress, groupNames]) => ({
      resolverAddress: resolverAddress as `0x${string}`,
      names: groupNames,
    }))
  }, [names, rolesQueries, v2Queries, canEdit])

  // Shared records (apply-to-all)
  const [sharedRecords, setSharedRecords] = useState<BulkRecordSet>(createEmptyRecordSet)

  // Per-name overrides
  const [perNameOverrides, setPerNameOverrides] = useState<Map<string, Partial<BulkRecordSet>>>(new Map())

  // Fields that have been explicitly cleared (set to empty string to remove existing value)
  const [clearedFields, setClearedFields] = useState<Set<string>>(new Set())

  // Custom record keys (shared)
  const [customRecordKeys, setCustomRecordKeys] = useState<string[]>([])

  // Per-name custom record keys (independent of shared)
  const [perNameCustomKeys, setPerNameCustomKeys] = useState<Map<string, string[]>>(new Map())

  // UI state
  const [step, setStep] = useState<BulkEditStep>('loading_roles')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [transactionStatuses, setTransactionStatuses] = useState<TransactionStatus[]>([])
  const [editMode, setEditMode] = useState<'shared' | 'per-name'>('shared')

  // Transition from loading_roles to editing once loaded
  useMemo(() => {
    if (!isLoadingRoles && step === 'loading_roles') {
      setStep('editing')
    }
  }, [isLoadingRoles, step])

  // Get effective records for a name (shared + overrides)
  const getEffectiveRecords = useCallback(
    (name: string): BulkRecordSet => {
      const override = perNameOverrides.get(name)
      if (!override) return sharedRecords
      return {
        textRecords: { ...sharedRecords.textRecords, ...override.textRecords },
        addressRecords: { ...sharedRecords.addressRecords, ...override.addressRecords },
        ethAddress: override.ethAddress ?? sharedRecords.ethAddress,
        contenthash: override.contenthash ?? sharedRecords.contenthash,
        customRecords: { ...sharedRecords.customRecords, ...override.customRecords },
      }
    },
    [sharedRecords, perNameOverrides]
  )

  // Shared record setters
  const setSharedTextRecord = useCallback((key: string, value: string) => {
    setSharedRecords((prev) => ({
      ...prev,
      textRecords: { ...prev.textRecords, [key]: value },
    }))
  }, [])

  const setSharedAddressRecord = useCallback((key: string, value: string) => {
    setSharedRecords((prev) => ({
      ...prev,
      addressRecords: { ...prev.addressRecords, [key]: value },
    }))
  }, [])

  const setSharedEthAddress = useCallback((value: string) => {
    setSharedRecords((prev) => ({ ...prev, ethAddress: value }))
  }, [])

  const setSharedContenthash = useCallback((value: string) => {
    setSharedRecords((prev) => ({ ...prev, contenthash: value }))
  }, [])

  const setSharedCustomRecord = useCallback((key: string, value: string) => {
    setSharedRecords((prev) => ({
      ...prev,
      customRecords: { ...prev.customRecords, [key]: value },
    }))
  }, [])

  const addCustomRecordKey = useCallback((key: string) => {
    setCustomRecordKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    setSharedRecords((prev) => ({
      ...prev,
      customRecords: { ...prev.customRecords, [key]: '' },
    }))
  }, [])

  const removeCustomRecordKey = useCallback((key: string) => {
    setCustomRecordKeys((prev) => prev.filter((k) => k !== key))
    setSharedRecords((prev) => {
      const next = { ...prev.customRecords }
      delete next[key]
      return { ...prev, customRecords: next }
    })
  }, [])

  // Clear field (mark as "set to empty string")
  const toggleClearField = useCallback((fieldKey: string) => {
    setClearedFields((prev) => {
      const next = new Set(prev)
      if (next.has(fieldKey)) {
        next.delete(fieldKey)
      } else {
        next.add(fieldKey)
      }
      return next
    })
  }, [])

  // Per-name override setters
  const setPerNameTextRecord = useCallback((name: string, key: string, value: string) => {
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      next.set(name, {
        ...existing,
        textRecords: { ...existing.textRecords, [key]: value },
      })
      return next
    })
  }, [])

  const setPerNameAddressRecord = useCallback((name: string, key: string, value: string) => {
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      next.set(name, {
        ...existing,
        addressRecords: { ...existing.addressRecords, [key]: value },
      })
      return next
    })
  }, [])

  const setPerNameEthAddress = useCallback((name: string, value: string) => {
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      next.set(name, { ...existing, ethAddress: value })
      return next
    })
  }, [])

  const setPerNameContenthash = useCallback((name: string, value: string) => {
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      next.set(name, { ...existing, contenthash: value })
      return next
    })
  }, [])

  const setPerNameCustomRecord = useCallback((name: string, key: string, value: string) => {
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      next.set(name, {
        ...existing,
        customRecords: { ...existing.customRecords, [key]: value },
      })
      return next
    })
  }, [])

  const addPerNameCustomKey = useCallback((name: string, key: string) => {
    setPerNameCustomKeys((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || []
      if (!existing.includes(key)) {
        next.set(name, [...existing, key])
      }
      return next
    })
    // Initialize value in per-name overrides
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      next.set(name, {
        ...existing,
        customRecords: { ...existing.customRecords, [key]: '' },
      })
      return next
    })
  }, [])

  const removePerNameCustomKey = useCallback((name: string, key: string) => {
    setPerNameCustomKeys((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || []
      next.set(
        name,
        existing.filter((k) => k !== key)
      )
      return next
    })
    // Remove value from per-name overrides
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      const existing = next.get(name) || {}
      if (existing.customRecords) {
        const records = { ...existing.customRecords }
        delete records[key]
        next.set(name, { ...existing, customRecords: records })
      }
      return next
    })
  }, [])

  const resetPerNameOverrides = useCallback((name: string) => {
    setPerNameOverrides((prev) => {
      const next = new Map(prev)
      next.delete(name)
      return next
    })
    setPerNameCustomKeys((prev) => {
      const next = new Map(prev)
      next.delete(name)
      return next
    })
  }, [])

  // Check if there are any changes to submit
  const hasChanges = useMemo(() => {
    const r = sharedRecords
    for (const key of TEXT_RECORD_KEYS) {
      if (r.textRecords[key]) return true
    }
    for (const key of ADDRESS_RECORD_KEYS) {
      if (r.addressRecords[key]) return true
    }
    if (r.ethAddress) return true
    if (r.contenthash) return true
    for (const key of Object.keys(r.customRecords)) {
      if (r.customRecords[key]) return true
    }
    if (clearedFields.size > 0) return true
    if (perNameOverrides.size > 0) {
      for (const override of perNameOverrides.values()) {
        if (override.textRecords && Object.values(override.textRecords).some((v) => v !== undefined)) return true
        if (override.addressRecords && Object.values(override.addressRecords).some((v) => v !== undefined)) return true
        if (override.ethAddress) return true
        if (override.contenthash) return true
        if (override.customRecords && Object.values(override.customRecords).some((v) => v !== undefined)) return true
      }
    }
    return false
  }, [sharedRecords, clearedFields, perNameOverrides])

  const execute = useCallback(
    async (statuses: TransactionStatus[], start: number, end: number) => {
      if (!publicClient) return

      const walletClient = await getWalletClient()
      await ensureChain(walletClient, activeChain.id)

      const update = (index: number, patch: Partial<TransactionStatus>) =>
        setTransactionStatuses((prev) => prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s)))

      const succeeded = await runTransactions(statuses, start, end, async (index) => {
        try {
          update(index, { status: 'confirming', error: null })
          setStep('confirming')
          const hash = await walletClient.sendTransaction({
            to: statuses[index].to,
            data: statuses[index].data,
            chain: activeChain,
          })
          update(index, { status: 'processing', txHash: hash })
          setStep('processing')
          await waitForSuccess(publicClient, hash)
          update(index, { status: 'success' })
          return true
        } catch (err: unknown) {
          update(index, { status: 'error', error: err instanceof Error ? err.message : 'Transaction failed' })
          return false
        }
      })

      for (const name of new Set(statuses.flatMap((s) => s.names))) {
        queryClient.invalidateQueries({ queryKey: ['name', 'metadata', name] })
        queryClient.invalidateQueries({ queryKey: ['name', 'details', name] })
        queryClient.invalidateQueries({ queryKey: ['name', 'roles', name] })
        queryClient.invalidateQueries({ queryKey: ['name', 'v2', name] })
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] })

      const hasError = succeeded.includes(false)
      setStep(hasError ? 'error' : 'success')
      setErrorMessage(hasError ? 'One or more transactions failed. See details above.' : null)
    },
    [publicClient, getWalletClient, queryClient]
  )

  // Execute all transactions
  const saveRecords = useCallback(async () => {
    if (!publicClient || !address) return

    setStep('confirming')
    setErrorMessage(null)

    const recordsFor = (name: string) =>
      buildRecords(
        getEffectiveRecords(name),
        [...customRecordKeys, ...(perNameCustomKeys.get(name) || [])],
        clearedFields
      )
    const pending = { status: 'pending' as const, txHash: null, error: null }

    try {
      // Build transaction plan: split large groups into batches
      const statuses: TransactionStatus[] = []
      for (const group of resolverGroups) {
        for (let i = 0; i < group.names.length; i += MAX_NAMES_PER_MULTICALL) {
          const batchNames = group.names.slice(i, i + MAX_NAMES_PER_MULTICALL)
          const calls = batchNames.flatMap((name) => encodeRecordCalls('node', name, recordsFor(name)))
          if (calls.length > 0) {
            statuses.push({
              to: group.resolverAddress,
              data: encodeFunctionData({ abi: PublicResolverAbi, functionName: 'multicall', args: [calls] }),
              names: batchNames,
              kind: 'write',
              ordered: false,
              ...pending,
            })
          }
        }
      }

      const v2Changes = names
        .filter((_, i) => v2Queries[i]?.data && canEdit(i))
        .map((name) => ({ name, changes: recordsFor(name) }))
        .filter(({ changes }) => changes.length > 0)
      if (ensV2 && v2Changes.length > 0) {
        const owned = await getOwnedResolver(publicClient, ensV2, address)
        const plans = await Promise.all(
          v2Changes.map(({ name, changes }) => planRecordWrite(publicClient, ensV2, owned, address, name, changes))
        )
        statuses.push(
          ...recordWriteTransactions(ensV2, owned, address, plans).map((tx) => ({ ...tx, ordered: true, ...pending }))
        )
      }

      if (statuses.length === 0) return setStep('editing')
      setTransactionStatuses(statuses)
      await execute(statuses, 0, statuses.length)
    } catch (err: unknown) {
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Transaction failed')
    }
  }, [
    publicClient,
    address,
    names,
    resolverGroups,
    v2Queries,
    canEdit,
    ensV2,
    getEffectiveRecords,
    customRecordKeys,
    perNameCustomKeys,
    clearedFields,
    execute,
  ])

  // Retry a specific failed transaction
  const retryTransaction = useCallback(
    async (index: number) => {
      const status = transactionStatuses[index]
      if (!status || status.status !== 'error') return
      await execute(transactionStatuses, index, status.ordered ? transactionStatuses.length : index + 1)
    },
    [transactionStatuses, execute]
  )

  const resetToEditing = useCallback(() => {
    setStep('editing')
    setErrorMessage(null)
    setTransactionStatuses([])
  }, [])

  return {
    // Roles data
    isLoadingRoles,
    managedNames,
    skippedNames,
    resolverGroups,
    // Records state
    sharedRecords,
    setSharedTextRecord,
    setSharedAddressRecord,
    setSharedEthAddress,
    setSharedContenthash,
    setSharedCustomRecord,
    addCustomRecordKey,
    removeCustomRecordKey,
    customRecordKeys,
    // Clear fields
    clearedFields,
    toggleClearField,
    // Per-name overrides
    perNameOverrides,
    setPerNameTextRecord,
    setPerNameAddressRecord,
    setPerNameEthAddress,
    setPerNameContenthash,
    setPerNameCustomRecord,
    perNameCustomKeys,
    addPerNameCustomKey,
    removePerNameCustomKey,
    resetPerNameOverrides,
    getEffectiveRecords,
    // UI state
    editMode,
    setEditMode,
    step,
    setStep,
    hasChanges,
    errorMessage,
    transactionStatuses,
    // Actions
    saveRecords,
    retryTransaction,
    resetToEditing,
  }
}
