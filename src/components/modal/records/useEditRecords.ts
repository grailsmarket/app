import { useState, useCallback, useMemo, useEffect } from 'react'
import { namehash, encodeFunctionData, bytesToHex, toHex } from 'viem'
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

const ADDRESS_RECORD_KEYS = ['eth', 'btc', 'sol', 'doge'] as const

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

  // UI state
  const [step, setStep] = useState<EditStep>('editing')
  const [imageUploadTarget, setImageUploadTarget] = useState<'avatar' | 'header' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
    return false
  }, [records, initialRecords, addressRecords, initialAddressRecords])

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

  // Save all changed records
  const saveRecords = useCallback(async () => {
    if (!name || !walletClient || !resolverAddress || !publicClient) return

    setStep('confirming')
    setErrorMessage(null)

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

      if (calls.length === 0) return

      setStep('processing')

      const hash = await walletClient.writeContract({
        address: resolverAddress,
        abi: PublicResolverAbi,
        functionName: 'multicall',
        args: [calls],
        chain: mainnet,
      })

      await publicClient.waitForTransactionReceipt({ hash })

      // Invalidate metadata cache
      queryClient.invalidateQueries({ queryKey: ['name', 'metadata', name] })

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
    queryClient,
  ])

  return {
    records,
    setRecord,
    addressRecords,
    setAddressRecord,
    visibleAddressRecords,
    addVisibleAddressRecord,
    hiddenAddressRecords,
    step,
    setStep,
    imageUploadTarget,
    setImageUploadTarget,
    hasChanges,
    saveRecords,
    errorMessage,
    resolverAddress,
    address,
  }
}
