import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { namehash, labelhash, hexToBigInt, encodeFunctionData, toHex, isAddress, BaseError } from 'viem'
import { useAccount, usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PublicResolverAbi } from '@/constants/web3/abi/PublicResolverAbi'
import { RegistryAbi } from '@/constants/web3/abi/RegistryAbi'
import { BaseRegistrarAbi } from '@/constants/web3/abi/BaseRegistrar'
import { resolveEnsAddress } from '@/utils/web3/ens'
import { fetchNameRoles } from '@/api/name/roles'
import { TEXT_RECORD_KEYS, ADDRESS_RECORD_KEYS, COIN_TYPES } from '@/constants/ens/records'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import { config } from '@/lib/config'
import { activeChain } from '@/constants/web3/chain'

export type EditStep = 'editing' | 'confirming' | 'processing' | 'success' | 'error'

/** The transactions a V1 save can send, in the order they are sent. */
export type V1TxKind = 'records' | 'manager' | 'owner'

/** A readable line for the error screen, plus the raw text for its details when the two differ. */
export const describeTxError = (err: unknown, fallback = 'Transaction failed') => {
  const message = err instanceof Error ? err.message : fallback
  const short = err instanceof BaseError ? err.shortMessage : message
  return { message: short, details: short !== message ? message : null }
}

export const useEditRecords = (name: string | null, metadata: Record<string, string> | null) => {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const getWalletClient = useGetWalletClient()
  const queryClient = useQueryClient()
  // Keep background refreshes from replacing edits already made in this modal.
  const editedFields = useRef(new Set<string>())

  const { data: roles } = useQuery({
    queryKey: ['name', 'roles', name],
    queryFn: async () => {
      if (!name) return null
      const roles = await fetchNameRoles(name)
      return roles
    },
    enabled: !!name,
  })
  const ownerAddress = roles?.owner || ''
  const managerAddress = roles?.manager || ''
  const resolverAddress = roles?.resolver || ''
  const ethAddress = roles ? roles.ethAddress || '' : metadata?.Ethereum || metadata?.ethereum || metadata?.eth || ''

  // Roles state
  const [roleOwner, setRoleOwnerState] = useState(ownerAddress)
  const [roleManager, setRoleManagerState] = useState(managerAddress)
  const [roleEthRecord, setRoleEthRecordState] = useState(ethAddress)

  useEffect(() => {
    if (!editedFields.current.has('owner')) setRoleOwnerState(ownerAddress)
    if (!editedFields.current.has('manager')) setRoleManagerState(managerAddress)
    if (!editedFields.current.has('eth')) setRoleEthRecordState(ethAddress)
  }, [ownerAddress, managerAddress, ethAddress])

  // Text records state
  const [records, setRecords] = useState<Record<string, string>>({})
  const [initialRecords, setInitialRecords] = useState<Record<string, string>>({})

  // Address records state (non-ETH only — ETH is in roles)
  const [addressRecords, setAddressRecords] = useState<Record<string, string>>({ btc: '', sol: '', doge: '' })
  const [initialAddressRecords, setInitialAddressRecords] = useState<Record<string, string>>({
    btc: '',
    sol: '',
    doge: '',
  })
  const [visibleAddressRecords, setVisibleAddressRecords] = useState<Set<string>>(new Set())

  // Custom records state (any metadata key not in TEXT_RECORD_KEYS or ADDRESS_RECORD_KEYS)
  const [customRecords, setCustomRecords] = useState<Record<string, string>>({})
  const [initialCustomRecords, setInitialCustomRecords] = useState<Record<string, string>>({})
  const [visibleCustomRecords, setVisibleCustomRecords] = useState<Set<string>>(new Set())

  // Resolved ENS addresses for role fields
  const [resolvedRoleOwner, setResolvedRoleOwner] = useState<string | null>(null)
  const [resolvedRoleManager, setResolvedRoleManager] = useState<string | null>(null)
  const [resolvedRoleEthRecord, setResolvedRoleEthRecord] = useState<string | null>(null)
  const [roleOwnerResolving, setRoleOwnerResolving] = useState(false)
  const [roleManagerResolving, setRoleManagerResolving] = useState(false)
  const [roleEthRecordResolving, setRoleEthRecordResolving] = useState(false)

  // UI state
  const [step, setStep] = useState<EditStep>('editing')
  const [imageUploadTarget, setImageUploadTarget] = useState<'avatar' | 'header' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  // Reported for the progress screens: what this save sends, each transaction's hash and which ones confirmed.
  const [txPlan, setTxPlan] = useState<V1TxKind[]>([])
  const [currentTx, setCurrentTx] = useState<V1TxKind | null>(null)
  const [txHashes, setTxHashes] = useState<Partial<Record<V1TxKind, string>>>({})
  const [confirmedTxs, setConfirmedTxs] = useState<V1TxKind[]>([])
  const [recordChangeCount, setRecordChangeCount] = useState(0)

  // Initialize state from metadata
  useEffect(() => {
    if (!metadata || editedFields.current.has('records')) return

    const textRecs: Record<string, string> = {}
    for (const key of TEXT_RECORD_KEYS) {
      textRecs[key] = metadata[key] || ''
    }
    setRecords(textRecs)
    setInitialRecords(textRecs)

    const addrRecs: Record<string, string> = { btc: '', sol: '', doge: '' }
    const visible = new Set<string>()
    for (const key of ADDRESS_RECORD_KEYS) {
      const value = metadata[key] || ''
      addrRecs[key] = value
      if (value) visible.add(key)
    }
    setAddressRecords(addrRecs)
    setInitialAddressRecords(addrRecs)
    setVisibleAddressRecords(visible)

    // Custom records: any key not in predefined sets
    const knownKeys = new Set<string>([
      ...TEXT_RECORD_KEYS,
      ...ADDRESS_RECORD_KEYS,
      'eth',
      'Ethereum',
      'ethereum',
      'resolverAddress',
    ])
    const customRecs: Record<string, string> = {}
    const visibleCustom = new Set<string>()
    for (const [key, value] of Object.entries(metadata)) {
      if (!knownKeys.has(key) && typeof value === 'string') {
        customRecs[key] = value
        visibleCustom.add(key)
      }
    }
    setCustomRecords(customRecs)
    setInitialCustomRecords(customRecs)
    setVisibleCustomRecords(visibleCustom)
  }, [metadata])

  // Resolve ENS names for role fields (debounced)
  useEffect(() => {
    if (!roleOwner) {
      setResolvedRoleOwner(null)
      setRoleOwnerResolving(false)
      return
    }
    if (isAddress(roleOwner)) {
      setResolvedRoleOwner(roleOwner)
      setRoleOwnerResolving(false)
      return
    }
    if (roleOwner.includes('.')) {
      setRoleOwnerResolving(true)
      const timeout = setTimeout(async () => {
        const resolved = await resolveEnsAddress(roleOwner)
        setResolvedRoleOwner(resolved || null)
        setRoleOwnerResolving(false)
      }, 500)
      return () => clearTimeout(timeout)
    }
    setResolvedRoleOwner(null)
    setRoleOwnerResolving(false)
  }, [roleOwner])

  useEffect(() => {
    if (!roleManager) {
      setResolvedRoleManager(null)
      setRoleManagerResolving(false)
      return
    }
    if (isAddress(roleManager)) {
      setResolvedRoleManager(roleManager)
      setRoleManagerResolving(false)
      return
    }
    if (roleManager.includes('.')) {
      setRoleManagerResolving(true)
      const timeout = setTimeout(async () => {
        const resolved = await resolveEnsAddress(roleManager)
        setResolvedRoleManager(resolved || null)
        setRoleManagerResolving(false)
      }, 500)
      return () => clearTimeout(timeout)
    }
    setResolvedRoleManager(null)
    setRoleManagerResolving(false)
  }, [roleManager])

  useEffect(() => {
    if (!roleEthRecord) {
      setResolvedRoleEthRecord(null)
      setRoleEthRecordResolving(false)
      return
    }
    if (isAddress(roleEthRecord)) {
      setResolvedRoleEthRecord(roleEthRecord)
      setRoleEthRecordResolving(false)
      return
    }
    if (roleEthRecord.includes('.')) {
      setRoleEthRecordResolving(true)
      const timeout = setTimeout(async () => {
        const resolved = await resolveEnsAddress(roleEthRecord)
        setResolvedRoleEthRecord(resolved || null)
        setRoleEthRecordResolving(false)
      }, 500)
      return () => clearTimeout(timeout)
    }
    setResolvedRoleEthRecord(null)
    setRoleEthRecordResolving(false)
  }, [roleEthRecord])

  const isRoleResolving = roleOwnerResolving || roleManagerResolving || roleEthRecordResolving

  // Permission checks (based on on-chain values, not edited values)
  const isManager = useMemo(() => {
    if (!address || !managerAddress) return false
    return address.toLowerCase() === managerAddress.toLowerCase()
  }, [address, managerAddress])

  const isOwner = useMemo(() => {
    if (!address || !ownerAddress) return false
    return address.toLowerCase() === ownerAddress.toLowerCase()
  }, [address, ownerAddress])

  // Only user edits count as role changes, including while API data is loading or refreshing.
  const ethRecordChanged = editedFields.current.has('eth') && roleEthRecord.toLowerCase() !== ethAddress.toLowerCase()
  const managerChanged =
    editedFields.current.has('manager') && roleManager.toLowerCase() !== managerAddress.toLowerCase()
  const ownerChanged = editedFields.current.has('owner') && roleOwner.toLowerCase() !== ownerAddress.toLowerCase()

  // Track dirty state
  const hasChanges = useMemo(() => {
    for (const key of TEXT_RECORD_KEYS) {
      if ((records[key] || '') !== (initialRecords[key] || '')) return true
    }
    for (const key of ADDRESS_RECORD_KEYS) {
      if ((addressRecords[key] || '') !== (initialAddressRecords[key] || '')) return true
    }
    const allCustomKeys = new Set([...Object.keys(customRecords), ...Object.keys(initialCustomRecords)])
    for (const key of allCustomKeys) {
      if ((customRecords[key] ?? '') !== (initialCustomRecords[key] ?? '')) return true
    }
    // Check role changes
    return ethRecordChanged || managerChanged || ownerChanged
  }, [
    records,
    initialRecords,
    addressRecords,
    initialAddressRecords,
    customRecords,
    initialCustomRecords,
    ethRecordChanged,
    managerChanged,
    ownerChanged,
  ])

  // Update text record
  const setRecord = useCallback((key: string, value: string) => {
    editedFields.current.add('records')
    setRecords((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Update address record
  const setAddressRecord = useCallback((key: string, value: string) => {
    editedFields.current.add('records')
    setAddressRecords((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Add an address record to visible set
  const addVisibleAddressRecord = useCallback((key: string) => {
    editedFields.current.add('records')
    setVisibleAddressRecords((prev) => new Set([...prev, key]))
  }, [])

  // Hidden address record keys (available to add)
  const hiddenAddressRecords = useMemo(() => {
    return ADDRESS_RECORD_KEYS.filter((key) => !visibleAddressRecords.has(key))
  }, [visibleAddressRecords])

  // Custom record functions
  const setCustomRecord = useCallback((key: string, value: string) => {
    editedFields.current.add('records')
    setCustomRecords((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addCustomRecord = useCallback((key: string) => {
    editedFields.current.add('records')
    setCustomRecords((prev) => ({ ...prev, [key]: '' }))
    setVisibleCustomRecords((prev) => new Set([...prev, key]))
  }, [])

  const removeCustomRecord = useCallback((key: string) => {
    editedFields.current.add('records')
    setVisibleCustomRecords((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    setCustomRecords((prev) => ({ ...prev, [key]: '' }))
  }, [])

  // Visible custom record keys (ordered)
  const visibleCustomRecordKeys = useMemo(() => {
    return Array.from(visibleCustomRecords)
  }, [visibleCustomRecords])

  // Role setters
  const setRoleOwner = useCallback((value: string) => {
    editedFields.current.add('owner')
    setRoleOwnerState(value)
  }, [])
  const setRoleManager = useCallback((value: string) => {
    editedFields.current.add('manager')
    setRoleManagerState(value)
  }, [])
  const setRoleEthRecord = useCallback((value: string) => {
    editedFields.current.add('eth')
    setRoleEthRecordState(value)
  }, [])

  // Save all changed records and roles
  const saveRecords = useCallback(async () => {
    if (!name || !resolverAddress || !publicClient) return

    setStep('confirming')
    setErrorMessage(null)
    setErrorDetails(null)
    setTxHash(null)
    setTxHashes({})
    setConfirmedTxs([])

    // Helper: resolve an input value to an effective address
    const resolveRole = (value: string, resolved: string | null): `0x${string}` | null => {
      if (isAddress(value)) return value as `0x${string}`
      if (resolved && isAddress(resolved)) return resolved as `0x${string}`
      return null
    }

    try {
      const node = namehash(name)

      // --- Step 1: Resolver multicall (text records + address records + custom records + ETH record) ---
      const calls: `0x${string}`[] = []

      // Encode changed text records
      for (const key of TEXT_RECORD_KEYS) {
        const current = records[key] || ''
        const initial = initialRecords[key] || ''
        if (current !== initial) {
          calls.push(
            encodeFunctionData({
              abi: PublicResolverAbi,
              functionName: 'setText',
              args: [node, key, current],
            })
          )
        }
      }

      // Encode changed address records (BTC etc, not ETH)
      for (const key of ADDRESS_RECORD_KEYS) {
        const current = addressRecords[key] || ''
        const initial = initialAddressRecords[key] || ''
        if (current !== initial) {
          const coinType = BigInt(COIN_TYPES[key])
          const addressBytes = current
            ? (toHex(new TextEncoder().encode(current)) as `0x${string}`)
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

      // Encode changed custom records
      const allCustomKeys = new Set([...Object.keys(customRecords), ...Object.keys(initialCustomRecords)])
      for (const key of allCustomKeys) {
        const current = customRecords[key] ?? ''
        const initial = initialCustomRecords[key] ?? ''
        if (current !== initial) {
          calls.push(
            encodeFunctionData({
              abi: PublicResolverAbi,
              functionName: 'setText',
              args: [node, key, current],
            })
          )
        }
      }

      // Encode ETH record change from Roles tab
      if (ethRecordChanged) {
        const effectiveEthAddr =
          resolveRole(roleEthRecord, resolvedRoleEthRecord) ||
          ('0x0000000000000000000000000000000000000000' as `0x${string}`)
        calls.push(
          encodeFunctionData({
            abi: PublicResolverAbi,
            functionName: 'setAddr',
            args: [node, effectiveEthAddr],
          })
        )
      }

      // Report the whole run up front so the progress screen can list every transaction it sends.
      const plan: V1TxKind[] = []
      if (calls.length > 0) plan.push('records')
      if (managerChanged && roleManager) plan.push('manager')
      if (ownerChanged && roleOwner && ownerAddress) plan.push('owner')
      setTxPlan(plan)
      setCurrentTx(plan[0] ?? null)
      setRecordChangeCount(calls.length)

      // Inside the try, so a missing or locked wallet shows the error screen instead of being swallowed.
      const walletClient = await getWalletClient()

      // Submit multicall if there are resolver changes
      if (calls.length > 0) {
        const hash = await walletClient.writeContract({
          address: resolverAddress,
          abi: PublicResolverAbi,
          functionName: 'multicall',
          args: [calls],
          chain: activeChain,
        })

        setTxHash(hash)
        setTxHashes((previous) => ({ ...previous, records: hash }))
        setStep('processing')
        const receipt = await waitForTransaction(publicClient, hash)
        if (receipt.status !== 'success') throw new Error('The transaction reverted. Its changes were not saved.')
        refreshEnsQueries(queryClient, receipt)
        setConfirmedTxs((previous) => [...previous, 'records'])
      }

      // --- Step 2: Manager change (setOwner on Registry, or reclaim on BaseRegistrar) ---
      if (managerChanged && roleManager) {
        setCurrentTx('manager')
        const effectiveManager = resolveRole(roleManager, resolvedRoleManager)
        if (!effectiveManager) {
          throw new Error(`Could not resolve "${roleManager}" to an address`)
        }

        setStep('confirming')
        const label = name.endsWith('.eth') ? name.slice(0, -4) : name.split('.')[0]
        const tokenId = hexToBigInt(labelhash(label))

        let hash: `0x${string}`
        if (isManager) {
          // Current manager can use setOwner on the Registry
          hash = await walletClient.writeContract({
            address: config.ensRegistry,
            abi: RegistryAbi,
            functionName: 'setOwner',
            args: [node, effectiveManager],
            chain: activeChain,
          })
        } else {
          // NFT owner can use reclaim on the BaseRegistrar
          hash = await walletClient.writeContract({
            address: config.ensRegistrar,
            abi: BaseRegistrarAbi,
            functionName: 'reclaim',
            args: [tokenId, effectiveManager],
            chain: activeChain,
          })
        }

        setTxHash(hash)
        setTxHashes((previous) => ({ ...previous, manager: hash }))
        setStep('processing')
        const receipt = await waitForTransaction(publicClient, hash)
        if (receipt.status !== 'success') throw new Error('The transaction reverted. Its changes were not saved.')
        refreshEnsQueries(queryClient, receipt)
        setConfirmedTxs((previous) => [...previous, 'manager'])
      }

      // --- Step 3: Owner transfer (safeTransferFrom on BaseRegistrar) ---
      if (ownerChanged && roleOwner && ownerAddress) {
        setCurrentTx('owner')
        const effectiveOwner = resolveRole(roleOwner, resolvedRoleOwner)
        if (!effectiveOwner) {
          throw new Error(`Could not resolve "${roleOwner}" to an address`)
        }

        setStep('confirming')
        const label = name.endsWith('.eth') ? name.slice(0, -4) : name.split('.')[0]
        const tokenId = hexToBigInt(labelhash(label))

        const hash = await walletClient.writeContract({
          address: config.ensRegistrar,
          abi: BaseRegistrarAbi,
          functionName: 'safeTransferFrom',
          args: [ownerAddress, effectiveOwner, tokenId],
          chain: activeChain,
        })

        setTxHash(hash)
        setTxHashes((previous) => ({ ...previous, owner: hash }))
        setStep('processing')
        const receipt = await waitForTransaction(publicClient, hash)
        if (receipt.status !== 'success') throw new Error('The transaction reverted. Its changes were not saved.')
        refreshEnsQueries(queryClient, receipt)
        setConfirmedTxs((previous) => [...previous, 'owner'])
      }

      setStep('success')
    } catch (err: unknown) {
      const { message, details } = describeTxError(err)
      setStep('error')
      setErrorMessage(message)
      setErrorDetails(details)
    }
  }, [
    name,
    getWalletClient,
    resolverAddress,
    publicClient,
    records,
    initialRecords,
    addressRecords,
    initialAddressRecords,
    customRecords,
    initialCustomRecords,
    roleEthRecord,
    ethRecordChanged,
    roleManager,
    managerChanged,
    roleOwner,
    ownerChanged,
    ownerAddress,
    isManager,
    resolvedRoleOwner,
    resolvedRoleManager,
    resolvedRoleEthRecord,
    queryClient,
  ])

  // Reset to editing state (for "Try Again") — keeps current record values
  const resetToEditing = useCallback(() => {
    setStep('editing')
    setErrorMessage(null)
    setErrorDetails(null)
    setTxHash(null)
  }, [])

  return {
    records,
    setRecord,
    addressRecords,
    setAddressRecord,
    visibleAddressRecords,
    addVisibleAddressRecord,
    hiddenAddressRecords,
    customRecords,
    setCustomRecord,
    addCustomRecord,
    removeCustomRecord,
    visibleCustomRecordKeys,
    roleOwner,
    setRoleOwner,
    resolvedRoleOwner,
    roleOwnerResolving,
    roleManager,
    setRoleManager,
    resolvedRoleManager,
    roleManagerResolving,
    roleEthRecord,
    setRoleEthRecord,
    resolvedRoleEthRecord,
    roleEthRecordResolving,
    isRoleResolving,
    step,
    setStep,
    imageUploadTarget,
    setImageUploadTarget,
    hasChanges,
    saveRecords,
    resetToEditing,
    errorMessage,
    errorDetails,
    txHash,
    txPlan,
    currentTx,
    txHashes,
    confirmedTxs,
    recordChangeCount,
    resolverAddress,
    address,
    isManager,
    isOwner,
  }
}
