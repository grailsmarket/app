import { useState, useCallback, useMemo, useEffect } from 'react'
import { namehash, encodeFunctionData, toHex } from 'viem'
import { mainnet } from 'viem/chains'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { PublicResolverAbi } from '@/constants/abi/PublicResolverAbi'
import { RegistryAbi } from '@/constants/abi/RegistryAbi'
import { ENS_REGISTRY_CONTRACT_ADDRESS, ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS } from '@/constants/web3/contracts'

export type EditStep = 'editing' | 'confirming' | 'processing' | 'success' | 'error'

const TEXT_RECORD_KEYS = [
  'description',
  'status',
  'location',
  'url',
  'email',
  'com.twitter',
  'com.github',
  'org.telegram',
  'com.discord',
  'avatar',
  'header',
] as const

const ADDRESS_RECORD_KEYS = ['eth', 'btc'] as const

const COIN_TYPES: Record<string, number> = {
  eth: 60,
  btc: 0,
  sol: 501,
  doge: 3,
}

export function useEditRecords(name: string | null, metadata: Record<string, string> | null) {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const queryClient = useQueryClient()

  // Text records state
  const [records, setRecords] = useState<Record<string, string>>({})
  const [initialRecords, setInitialRecords] = useState<Record<string, string>>({})

  // Address records state
  const [addressRecords, setAddressRecords] = useState<Record<string, string>>({ eth: '', btc: '', sol: '', doge: '' })
  const [initialAddressRecords, setInitialAddressRecords] = useState<Record<string, string>>({
    eth: '',
    btc: '',
    sol: '',
    doge: '',
  })
  const [visibleAddressRecords, setVisibleAddressRecords] = useState<Set<string>>(new Set())

  // Custom records state (any metadata key not in TEXT_RECORD_KEYS or ADDRESS_RECORD_KEYS)
  const [customRecords, setCustomRecords] = useState<Record<string, string>>({})
  const [initialCustomRecords, setInitialCustomRecords] = useState<Record<string, string>>({})
  const [visibleCustomRecords, setVisibleCustomRecords] = useState<Set<string>>(new Set())

  // UI state
  const [step, setStep] = useState<EditStep>('editing')
  const [imageUploadTarget, setImageUploadTarget] = useState<'avatar' | 'header' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [resolverAddress, setResolverAddress] = useState<`0x${string}` | null>(null)

  // Initialize state from metadata
  useEffect(() => {
    if (!metadata) return

    const textRecs: Record<string, string> = {}
    for (const key of TEXT_RECORD_KEYS) {
      textRecs[key] = metadata[key] || ''
    }
    setRecords(textRecs)
    setInitialRecords(textRecs)

    const addrRecs: Record<string, string> = { eth: '', btc: '', sol: '', doge: '' }
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
    const knownKeys = new Set<string>([...TEXT_RECORD_KEYS, ...ADDRESS_RECORD_KEYS, 'resolverAddress'])
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

  // Resolve the resolver address
  useEffect(() => {
    if (!name || !publicClient) return

    const resolve = async () => {
      try {
        const node = namehash(name)
        const resolverAddr = (await publicClient.readContract({
          address: ENS_REGISTRY_CONTRACT_ADDRESS as `0x${string}`,
          abi: RegistryAbi,
          functionName: 'resolver',
          args: [node],
        })) as `0x${string}`

        setResolverAddress(
          resolverAddr !== '0x0000000000000000000000000000000000000000'
            ? resolverAddr
            : (ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS as `0x${string}`)
        )
      } catch {
        setResolverAddress(ENS_PUBLIC_RESOLVER_FALLBACK_ADDRESS as `0x${string}`)
      }
    }
    resolve()
  }, [name, publicClient])

  // Track dirty state
  const hasChanges = useMemo(() => {
    for (const key of TEXT_RECORD_KEYS) {
      if ((records[key] || '') !== (initialRecords[key] || '')) return true
    }
    for (const key of ADDRESS_RECORD_KEYS) {
      if ((addressRecords[key] || '') !== (initialAddressRecords[key] || '')) return true
    }
    // Check custom records (includes both edits and deletions)
    const allCustomKeys = new Set([...Object.keys(customRecords), ...Object.keys(initialCustomRecords)])
    for (const key of allCustomKeys) {
      if ((customRecords[key] ?? '') !== (initialCustomRecords[key] ?? '')) return true
    }
    return false
  }, [records, initialRecords, addressRecords, initialAddressRecords, customRecords, initialCustomRecords])

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
    // Set value to '' so it gets saved as a deletion if it existed before
    setCustomRecords((prev) => ({ ...prev, [key]: '' }))
  }, [])

  // Visible custom record keys (ordered)
  const visibleCustomRecordKeys = useMemo(() => {
    return Array.from(visibleCustomRecords)
  }, [visibleCustomRecords])

  // Save all changed records
  const saveRecords = useCallback(async () => {
    if (!name || !walletClient || !resolverAddress || !publicClient) return

    setStep('confirming')
    setErrorMessage(null)
    setTxHash(null)

    try {
      const node = namehash(name)
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

      // Encode changed address records
      for (const key of ADDRESS_RECORD_KEYS) {
        const current = addressRecords[key] || ''
        const initial = initialAddressRecords[key] || ''
        if (current !== initial) {
          if (key === 'eth') {
            // ETH uses the 2-arg setAddr overload
            calls.push(
              encodeFunctionData({
                abi: PublicResolverAbi,
                functionName: 'setAddr',
                args: [node, current as `0x${string}`],
              })
            )
          } else {
            // BTC/SOL/DOGE use the 3-arg setAddr overload with coinType
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
      }

      // Encode changed custom records (includes deletions where value is '')
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

      if (calls.length === 0) return

      const hash = await walletClient.writeContract({
        address: resolverAddress,
        abi: PublicResolverAbi,
        functionName: 'multicall',
        args: [calls],
        chain: mainnet,
      })

      setTxHash(hash)
      setStep('processing')

      await publicClient.waitForTransactionReceipt({ hash })

      // Invalidate metadata + name details cache
      queryClient.invalidateQueries({ queryKey: ['name', 'metadata', name] })
      queryClient.invalidateQueries({ queryKey: ['name', 'details', name] })

      setStep('success')
    } catch (err: unknown) {
      setStep('error')
      setErrorMessage(err instanceof Error ? err.message : 'Transaction failed')
    }
  }, [
    name,
    walletClient,
    resolverAddress,
    publicClient,
    records,
    initialRecords,
    addressRecords,
    initialAddressRecords,
    customRecords,
    initialCustomRecords,
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
  }
}
