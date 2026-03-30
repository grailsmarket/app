import { useState, useCallback, useMemo } from 'react'
import { namehash, encodeFunctionData, toHex } from 'viem'
import { mainnet } from 'viem/chains'
import { useAccount, usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { useQueries, useQueryClient } from '@tanstack/react-query'
import { PublicResolverAbi } from '@/constants/abi/PublicResolverAbi'
import { TEXT_RECORD_KEYS, ADDRESS_RECORD_KEYS, COIN_TYPES } from '@/constants/ens/records'
import { fetchNameRoles } from '@/api/name/roles'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

const MAX_NAMES_PER_MULTICALL = 50

export type BulkEditStep = 'loading_roles' | 'editing' | 'confirming' | 'processing' | 'success' | 'error'

export type BulkRecordSet = {
  textRecords: Record<string, string>
  addressRecords: Record<string, string>
  ethAddress: string
  contenthash: string
  customRecords: Record<string, string>
}

export type TransactionStatus = {
  resolverAddress: `0x${string}`
  names: string[]
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

export function useBulkEditRecords(names: string[]) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const getWalletClient = useGetWalletClient()
  const queryClient = useQueryClient()

  // Fetch roles for all names in parallel
  const rolesQueries = useQueries({
    queries: names.map((name) => ({
      queryKey: ['name', 'roles', name],
      queryFn: () => fetchNameRoles(name),
      enabled: !!name,
    })),
  })

  const isLoadingRoles = rolesQueries.some((q) => q.isLoading)

  // Names where user is the manager
  const managedNames = useMemo(() => {
    if (!address) return []
    return names.filter((_, i) => {
      const roles = rolesQueries[i]?.data
      if (!roles) return false
      return roles.manager.toLowerCase() === address.toLowerCase()
    })
  }, [names, rolesQueries, address])

  // Names where user is NOT the manager
  const skippedNames = useMemo(() => {
    if (!address) return names
    return names.filter((_, i) => {
      const roles = rolesQueries[i]?.data
      if (!roles) return true
      return roles.manager.toLowerCase() !== address.toLowerCase()
    })
  }, [names, rolesQueries, address])

  // Group names by resolver address
  const resolverGroups = useMemo((): ResolverGroup[] => {
    if (!address) return []
    const groupMap = new Map<string, string[]>()

    names.forEach((name, i) => {
      const roles = rolesQueries[i]?.data
      if (!roles) return
      if (roles.manager.toLowerCase() !== address.toLowerCase()) return

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
  }, [names, rolesQueries, address])

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

  // Build multicall calldata for a list of names on a given resolver
  const buildCallsForGroup = useCallback(
    (groupNames: string[]): `0x${string}`[] => {
      const calls: `0x${string}`[] = []

      for (const name of groupNames) {
        const records = getEffectiveRecords(name)
        const node = namehash(name)

        // Text records
        for (const key of TEXT_RECORD_KEYS) {
          const value = records.textRecords[key]
          if (value || clearedFields.has(`text:${key}`)) {
            calls.push(
              encodeFunctionData({
                abi: PublicResolverAbi,
                functionName: 'setText',
                args: [node, key, value || ''],
              })
            )
          }
        }

        // Custom records (shared + per-name)
        const nameCustomKeys = perNameCustomKeys.get(name) || []
        const allCustomKeys = new Set([...customRecordKeys, ...nameCustomKeys])
        for (const key of allCustomKeys) {
          const value = records.customRecords[key]
          if (value || clearedFields.has(`custom:${key}`)) {
            calls.push(
              encodeFunctionData({
                abi: PublicResolverAbi,
                functionName: 'setText',
                args: [node, key, value || ''],
              })
            )
          }
        }

        // Address records (BTC etc, not ETH)
        for (const key of ADDRESS_RECORD_KEYS) {
          const value = records.addressRecords[key]
          if (value || clearedFields.has(`addr:${key}`)) {
            const coinType = BigInt(COIN_TYPES[key])
            const addressBytes = value
              ? (toHex(new TextEncoder().encode(value)) as `0x${string}`)
              : ('0x' as `0x${string}`)
            calls.push(
              encodeFunctionData({
                abi: PublicResolverAbi,
                functionName: 'setAddr',
                args: [node, coinType, addressBytes],
              })
            )
          }
        }

        // ETH address
        if (records.ethAddress || clearedFields.has('ethAddress')) {
          const ethAddr = records.ethAddress
            ? (records.ethAddress as `0x${string}`)
            : ('0x0000000000000000000000000000000000000000' as `0x${string}`)
          calls.push(
            encodeFunctionData({
              abi: PublicResolverAbi,
              functionName: 'setAddr',
              args: [node, ethAddr],
            })
          )
        }

        // Contenthash
        if (records.contenthash || clearedFields.has('contenthash')) {
          calls.push(
            encodeFunctionData({
              abi: PublicResolverAbi,
              functionName: 'setContenthash',
              args: [node, encodeContenthash(records.contenthash)],
            })
          )
        }
      }

      return calls
    },
    [getEffectiveRecords, clearedFields, customRecordKeys, perNameCustomKeys]
  )

  // Execute all transactions
  const saveRecords = useCallback(async () => {
    if (!publicClient || resolverGroups.length === 0) return

    const walletClient = await getWalletClient()
    await ensureChain(walletClient, mainnet.id)

    setStep('confirming')
    setErrorMessage(null)

    // Build transaction plan: split large groups into batches
    const txPlan: { resolverAddress: `0x${string}`; names: string[]; calls: `0x${string}`[] }[] = []

    for (const group of resolverGroups) {
      // Split into batches if group is too large
      for (let i = 0; i < group.names.length; i += MAX_NAMES_PER_MULTICALL) {
        const batchNames = group.names.slice(i, i + MAX_NAMES_PER_MULTICALL)
        const calls = buildCallsForGroup(batchNames)
        if (calls.length > 0) {
          txPlan.push({
            resolverAddress: group.resolverAddress,
            names: batchNames,
            calls,
          })
        }
      }
    }

    if (txPlan.length === 0) return

    // Initialize transaction statuses
    const statuses: TransactionStatus[] = txPlan.map((tx) => ({
      resolverAddress: tx.resolverAddress,
      names: tx.names,
      status: 'pending',
      txHash: null,
      error: null,
    }))
    setTransactionStatuses(statuses)

    let hasError = false

    // Execute sequentially (one per resolver group batch)
    for (let i = 0; i < txPlan.length; i++) {
      const tx = txPlan[i]

      try {
        // Update status to confirming
        setTransactionStatuses((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'confirming' } : s)))
        setStep('confirming')

        const hash = await walletClient.writeContract({
          address: tx.resolverAddress,
          abi: PublicResolverAbi,
          functionName: 'multicall',
          args: [tx.calls],
          chain: mainnet,
        })

        // Update status to processing with hash
        setTransactionStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'processing', txHash: hash } : s))
        )
        setStep('processing')

        await waitForTransaction(publicClient, hash)

        // Update status to success
        setTransactionStatuses((prev) => prev.map((s, idx) => (idx === i ? { ...s, status: 'success' } : s)))
      } catch (err: unknown) {
        hasError = true
        const message = err instanceof Error ? err.message : 'Transaction failed'
        setTransactionStatuses((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'error', error: message } : s))
        )
        // Continue with remaining transactions
      }
    }

    // Invalidate caches for all affected names
    const allAffectedNames = txPlan.flatMap((tx) => tx.names)
    for (const name of allAffectedNames) {
      queryClient.invalidateQueries({ queryKey: ['name', 'metadata', name] })
      queryClient.invalidateQueries({ queryKey: ['name', 'details', name] })
      queryClient.invalidateQueries({ queryKey: ['name', 'roles', name] })
    }
    queryClient.invalidateQueries({ queryKey: ['profile'] })

    setStep(hasError ? 'error' : 'success')
    if (hasError) {
      setErrorMessage('One or more transactions failed. See details above.')
    }
  }, [publicClient, resolverGroups, getWalletClient, buildCallsForGroup, queryClient])

  // Retry a specific failed transaction
  const retryTransaction = useCallback(
    async (index: number) => {
      if (!publicClient) return

      const status = transactionStatuses[index]
      if (!status || status.status !== 'error') return

      const walletClient = await getWalletClient()
      await ensureChain(walletClient, mainnet.id)

      const calls = buildCallsForGroup(status.names)
      if (calls.length === 0) return

      try {
        setTransactionStatuses((prev) =>
          prev.map((s, idx) => (idx === index ? { ...s, status: 'confirming', error: null } : s))
        )

        const hash = await walletClient.writeContract({
          address: status.resolverAddress,
          abi: PublicResolverAbi,
          functionName: 'multicall',
          args: [calls],
          chain: mainnet,
        })

        setTransactionStatuses((prev) =>
          prev.map((s, idx) => (idx === index ? { ...s, status: 'processing', txHash: hash } : s))
        )

        await waitForTransaction(publicClient, hash)

        setTransactionStatuses((prev) => prev.map((s, idx) => (idx === index ? { ...s, status: 'success' } : s)))

        // Invalidate caches
        for (const name of status.names) {
          queryClient.invalidateQueries({ queryKey: ['name', 'metadata', name] })
          queryClient.invalidateQueries({ queryKey: ['name', 'details', name] })
          queryClient.invalidateQueries({ queryKey: ['name', 'roles', name] })
        }
        queryClient.invalidateQueries({ queryKey: ['profile'] })

        // Check if all are now success
        const allSuccess = transactionStatuses.every((s, idx) => (idx === index ? true : s.status === 'success'))
        if (allSuccess) {
          setStep('success')
          setErrorMessage(null)
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Transaction failed'
        setTransactionStatuses((prev) =>
          prev.map((s, idx) => (idx === index ? { ...s, status: 'error', error: message } : s))
        )
      }
    },
    [publicClient, transactionStatuses, getWalletClient, buildCallsForGroup, queryClient]
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
