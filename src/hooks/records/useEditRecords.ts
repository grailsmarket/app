import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  type Address,
  type Hex,
  namehash,
  labelhash,
  hexToBigInt,
  toHex,
  isAddress,
  isAddressEqual,
  zeroAddress,
} from 'viem'
import { mainnet } from 'viem/chains'
import { useAccount, usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { useEnsV2 } from '@/hooks/useEnsV2'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PublicResolverAbi } from '@/constants/abi/PublicResolverAbi'
import { RegistryAbi } from '@/constants/abi/RegistryAbi'
import { BaseRegistrarAbi } from '@/constants/abi/BaseRegistrar'
import { ENS_V2_REGISTRY_ABI } from '@/constants/abi/ENSv2'
import { ENS_REGISTRY_CONTRACT_ADDRESS, ENS_REGISTRAR_ADDRESS } from '@/constants/web3/contracts'
import { resolveEnsAddress } from '@/utils/web3/ens'
import {
  type EnsRecord,
  ENS_V2_STATUS,
  encodeRecordCalls,
  getEthLabel,
  getOwnedResolver,
  getV2Name,
  getV2State,
  planRecordWrite,
  recordWriteTransactions,
} from '@/utils/web3/ensv2'
import { fetchNameRoles } from '@/api/name/roles'
import { TEXT_RECORD_KEYS, ADDRESS_RECORD_KEYS, COIN_TYPES } from '@/constants/ens/records'
import { waitForSuccess } from '@/utils/web3/safeTransaction'

export type EditStep = 'editing' | 'confirming' | 'processing' | 'success' | 'error'

export function useEditRecords(name: string | null, metadata: Record<string, string> | null) {
  const { address } = useAccount()
  const publicClient = usePublicClient({ chainId: mainnet.id })
  const getWalletClient = useGetWalletClient()
  const queryClient = useQueryClient()
  const ensV2 = useEnsV2()

  const { data: roles } = useQuery({
    queryKey: ['name', 'roles', name],
    queryFn: async () => {
      if (!name) return null
      const roles = await fetchNameRoles(name)
      return roles
    },
    enabled: !!name,
  })
  const { data: v2Name } = useQuery({
    queryKey: ['name', 'v2', name],
    queryFn: () => (ensV2 && name && publicClient ? getV2Name(publicClient, ensV2, name) : null),
    enabled: !!ensV2 && !!name && !!publicClient,
  })
  const ownerAddress = v2Name?.latestOwner || roles?.owner || ''
  const managerAddress = roles?.manager || ''
  const resolverAddress = roles?.resolver || ''
  const ethAddress = roles?.ethAddress || ''

  // Roles state
  const [roleOwner, setRoleOwnerState] = useState('')
  const [roleManager, setRoleManagerState] = useState('')
  const [roleEthRecord, setRoleEthRecordState] = useState('')

  useEffect(() => {
    if (!roles) return
    setRoleOwnerState(roles.owner)
    setRoleManagerState(roles.manager)
    setRoleEthRecordState(roles.ethAddress)
  }, [roles])

  useEffect(() => {
    if (v2Name) setRoleOwnerState(v2Name.latestOwner)
  }, [v2Name])

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
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isMovingRecords, setIsMovingRecords] = useState(false)

  // Initialize state from metadata
  useEffect(() => {
    if (!metadata) return

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

    // ETH record for Roles tab (metadata key is 'Ethereum' from chains, or 'eth')
    const ethValue = metadata['Ethereum'] || metadata['ethereum'] || metadata['eth'] || ''
    setRoleEthRecordState(ethValue)
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
    if (!address) return false
    if (v2Name) return v2Name.status === ENS_V2_STATUS.REGISTERED && isAddressEqual(v2Name.latestOwner, address)
    return !!managerAddress && address.toLowerCase() === managerAddress.toLowerCase()
  }, [address, managerAddress, v2Name])

  const isOwner = useMemo(() => {
    if (!address || !ownerAddress) return false
    return address.toLowerCase() === ownerAddress.toLowerCase()
  }, [address, ownerAddress])

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
    if (roleEthRecord !== ethAddress) return true
    if (roleManager.toLowerCase() !== managerAddress.toLowerCase()) return true
    if (roleOwner.toLowerCase() !== ownerAddress.toLowerCase()) return true
    return false
  }, [
    records,
    initialRecords,
    addressRecords,
    initialAddressRecords,
    customRecords,
    initialCustomRecords,
    roleEthRecord,
    ethAddress,
    roleManager,
    managerAddress,
    roleOwner,
    ownerAddress,
  ])

  // Update text record
  const setRecord = useCallback((key: string, value: string) => {
    setRecords((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Update address record
  const setAddressRecord = useCallback((key: string, value: string) => {
    setAddressRecords((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Add an address record to visible set
  const addVisibleAddressRecord = useCallback((key: string) => {
    setVisibleAddressRecords((prev) => new Set([...prev, key]))
  }, [])

  // Hidden address record keys (available to add)
  const hiddenAddressRecords = useMemo(() => {
    return ADDRESS_RECORD_KEYS.filter((key) => !visibleAddressRecords.has(key))
  }, [visibleAddressRecords])

  // Custom record functions
  const setCustomRecord = useCallback((key: string, value: string) => {
    setCustomRecords((prev) => ({ ...prev, [key]: value }))
  }, [])

  const addCustomRecord = useCallback((key: string) => {
    setCustomRecords((prev) => ({ ...prev, [key]: '' }))
    setVisibleCustomRecords((prev) => new Set([...prev, key]))
  }, [])

  const removeCustomRecord = useCallback((key: string) => {
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
  const setRoleOwner = useCallback((value: string) => setRoleOwnerState(value), [])
  const setRoleManager = useCallback((value: string) => setRoleManagerState(value), [])
  const setRoleEthRecord = useCallback((value: string) => setRoleEthRecordState(value), [])

  const saveRecords = useCallback(async () => {
    if (!name || !publicClient || (v2Name ? !ensV2 || !address : !resolverAddress)) return

    const walletClient = await getWalletClient()

    setStep('confirming')
    setErrorMessage(null)
    setTxHash(null)
    setIsMovingRecords(false)

    // Helper: resolve an input value to an effective address
    const resolveRole = (value: string, resolved: string | null): `0x${string}` | null => {
      if (isAddress(value)) return value as `0x${string}`
      if (resolved && isAddress(resolved)) return resolved as `0x${string}`
      return null
    }

    const send = async (transaction: () => Promise<Hex>) => {
      setStep('confirming')
      const hash = await transaction()
      setTxHash(hash)
      setStep('processing')
      await waitForSuccess(publicClient, hash)
    }

    try {
      const node = namehash(name)
      const changes: EnsRecord[] = [
        ...TEXT_RECORD_KEYS.filter((key) => (records[key] || '') !== (initialRecords[key] || '')).map((key) => ({
          type: 'text' as const,
          key,
          value: records[key] || '',
        })),
        ...ADDRESS_RECORD_KEYS.filter((key) => (addressRecords[key] || '') !== (initialAddressRecords[key] || '')).map(
          (key) => ({
            type: 'addr' as const,
            coinType: COIN_TYPES[key],
            value: addressRecords[key] ? toHex(new TextEncoder().encode(addressRecords[key])) : ('0x' as const),
          })
        ),
        ...[...new Set([...Object.keys(customRecords), ...Object.keys(initialCustomRecords)])]
          .filter((key) => (customRecords[key] ?? '') !== (initialCustomRecords[key] ?? ''))
          .map((key) => ({ type: 'text' as const, key, value: customRecords[key] ?? '' })),
        ...(roleEthRecord !== ethAddress
          ? [
              {
                type: 'addr' as const,
                coinType: 60,
                value: resolveRole(roleEthRecord, resolvedRoleEthRecord) || zeroAddress,
              },
            ]
          : []),
      ]

      if (v2Name && ensV2 && address) {
        if (changes.length > 0) {
          const owned = await getOwnedResolver(publicClient, ensV2, address)
          const plan = await planRecordWrite(publicClient, ensV2, owned, address, name, changes)
          setIsMovingRecords(plan.move)
          for (const tx of recordWriteTransactions(ensV2, owned, address, [plan])) {
            await send(() => walletClient.sendTransaction({ to: tx.to, data: tx.data, chain: mainnet }))
          }
        }
      } else if (changes.length > 0) {
        await send(() =>
          walletClient.writeContract({
            address: resolverAddress as Address,
            abi: PublicResolverAbi,
            functionName: 'multicall',
            args: [encodeRecordCalls('node', name, changes)],
            chain: mainnet,
          })
        )
      }

      // --- Manager change (setOwner on Registry, or reclaim on BaseRegistrar) ---
      const managerChanged = roleManager.toLowerCase() !== managerAddress.toLowerCase()
      if (!v2Name && managerChanged && roleManager) {
        const effectiveManager = resolveRole(roleManager, resolvedRoleManager)
        if (!effectiveManager) {
          throw new Error(`Could not resolve "${roleManager}" to an address`)
        }

        const label = name.endsWith('.eth') ? name.slice(0, -4) : name.split('.')[0]
        const tokenId = hexToBigInt(labelhash(label))

        if (isManager) {
          // Current manager can use setOwner on the Registry
          await send(() =>
            walletClient.writeContract({
              address: ENS_REGISTRY_CONTRACT_ADDRESS as `0x${string}`,
              abi: RegistryAbi,
              functionName: 'setOwner',
              args: [node, effectiveManager],
              chain: mainnet,
            })
          )
        } else {
          // NFT owner can use reclaim on the BaseRegistrar
          await send(() =>
            walletClient.writeContract({
              address: ENS_REGISTRAR_ADDRESS as `0x${string}`,
              abi: BaseRegistrarAbi,
              functionName: 'reclaim',
              args: [tokenId, effectiveManager],
              chain: mainnet,
            })
          )
        }
      }

      // --- Owner transfer ---
      const ownerChanged = roleOwner.toLowerCase() !== ownerAddress.toLowerCase()
      if (ownerChanged && roleOwner && ownerAddress) {
        const effectiveOwner = resolveRole(roleOwner, resolvedRoleOwner)
        if (!effectiveOwner) {
          throw new Error(`Could not resolve "${roleOwner}" to an address`)
        }

        if (v2Name && ensV2) {
          const { tokenId } = await getV2State(publicClient, ensV2, getEthLabel(name)!)
          await send(() =>
            walletClient.writeContract({
              address: ensV2.ethRegistry,
              abi: ENS_V2_REGISTRY_ABI,
              functionName: 'safeTransferFrom',
              args: [ownerAddress as Address, effectiveOwner, tokenId, BigInt(1), '0x'],
              chain: mainnet,
            })
          )
        } else {
          const label = name.endsWith('.eth') ? name.slice(0, -4) : name.split('.')[0]
          const tokenId = hexToBigInt(labelhash(label))
          await send(() =>
            walletClient.writeContract({
              address: ENS_REGISTRAR_ADDRESS as `0x${string}`,
              abi: BaseRegistrarAbi,
              functionName: 'safeTransferFrom',
              args: [ownerAddress, effectiveOwner, tokenId],
              chain: mainnet,
            })
          )
        }
      }

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['name', 'metadata', name] })
      queryClient.invalidateQueries({ queryKey: ['name', 'details', name] })
      queryClient.invalidateQueries({ queryKey: ['name', 'roles', name] })
      queryClient.invalidateQueries({ queryKey: ['name', 'v2', name] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['profileMetadata', name] })

      setStep('success')
    } catch (err: unknown) {
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Transaction failed')
    }
  }, [
    name,
    getWalletClient,
    resolverAddress,
    publicClient,
    v2Name,
    ensV2,
    address,
    records,
    initialRecords,
    addressRecords,
    initialAddressRecords,
    customRecords,
    initialCustomRecords,
    roleEthRecord,
    ethAddress,
    roleManager,
    managerAddress,
    roleOwner,
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
    txHash,
    resolverAddress,
    address,
    isManager,
    isOwner,
    isV2: !!v2Name,
    isMovingRecords,
  }
}
