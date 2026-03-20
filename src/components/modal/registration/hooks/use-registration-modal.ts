'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAccount, useBalance, useGasPrice, usePublicClient } from 'wagmi'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectRegistration,
  openRegistrationModal,
  setRegistrationFlowState,
  setSecret,
  setRegistrationError,
  setRegistrationMode,
  setQuantity,
  setTimeUnit,
  setCustomDuration,
  setEntryDuration,
  setBulkAvailability,
  setEntryCalculatedDuration,
  initializeBatches,
  setBatchCommitTxHash,
  setBatchCommitmentData,
  setBatchCommitted,
  setBatchRegisterTxHash,
  setBatchRegistered,
  setCurrentBatchIndex,
  closeRegistrationModal,
  reopenRegistrationModal,
  resetRegistrationModal,
} from '@/state/reducers/registration'
import useBulkRegisterDomains from '@/hooks/registrar/useBulkRegisterDomains'
import useETHPrice from '@/hooks/useETHPrice'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { YEAR_IN_SECONDS } from '@/constants/time'
import { normalizeName } from '@/lib/ens'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Hex, isAddress } from 'viem'
import { fetchAccount, useIsClient } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import { mainnet } from 'viem/chains'
import { useDebounce } from '@/hooks/useDebounce'
import { MIN_REGISTRATION_DURATION } from '@/constants/registration'
import { CalculationResults, TimeUnit } from '@/types/registration'
import { computeDurationForEntry } from '@/utils/registration'

const useRegistrationModal = () => {
  const isClient = useIsClient()
  const dispatch = useAppDispatch()
  const { modifyCart } = useModifyCart()
  const registrationState = useAppSelector(selectRegistration)
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)
  const { address } = useAccount()
  const { ethPrice } = useETHPrice()
  const { data: gasPrice } = useGasPrice()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const {
    generateSecret,
    checkBulkAvailable,
    getBulkTotalPrice,
    getBulkRentPrices,
    makeBulkCommitments,
    submitMultiCommit,
    submitMultiRegister,
    calculateDomainPriceUSD,
    getCommitmentAges,
    checkCommitmentAge,
  } = useBulkRegisterDomains()

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCancelWarning, setShowCancelWarning] = useState(false)
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number>(60)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(BigInt(500000))
  const [showCustomOwner, setShowCustomOwner] = useState(false)
  const [customOwner, setCustomOwner] = useState<string>('')
  const [showPerNameDurations, setShowPerNameDurations] = useState(false)
  const [perNameDatePickerIndex, setPerNameDatePickerIndex] = useState<number | null>(null)
  const [reverseRecord, setReverseRecord] = useState(false)
  const debouncedCustomOwner = useDebounce(customOwner, 500)

  const { data: account, isLoading: isResolving } = useQuery({
    queryKey: ['account', debouncedCustomOwner],
    queryFn: async () => {
      if (!isAddress(debouncedCustomOwner) && !debouncedCustomOwner.includes('.')) return null
      const response = await fetchAccount(debouncedCustomOwner)
      if (!isAddress(response?.address ?? '')) return null
      return response
    },
    enabled: !!customOwner,
  })

  const entries = registrationState.entries
  const batches = registrationState.batches
  const isBulk = entries.length > 1
  const totalBatches = batches.length
  const secret = registrationState.secret
  const { registrationMode, quantity, timeUnit, customDuration } = registrationState

  const firstName = entries[0]?.name ?? null
  const firstDomain = entries[0]?.domain ?? null

  const allNamesValid = useMemo(() => {
    return entries.every((e) => {
      const label = e.name.replace('.eth', '')
      return checkNameValidity(label)
    })
  }, [entries])

  const allAvailabilityChecked = entries.length > 0 && entries.every((e) => e.isAvailable !== null)
  const availableEntries = useMemo(() => entries.filter((e) => e.isAvailable !== false), [entries])
  const unavailableEntries = useMemo(() => entries.filter((e) => e.isAvailable === false), [entries])

  const { data: ethBalance } = useBalance({
    address,
    chainId: mainnet.id,
  })

  const entryDurations = useMemo(() => {
    return entries.map((entry) => {
      const seconds = computeDurationForEntry(entry, quantity, timeUnit, customDuration)
      return seconds
    })
  }, [entries, quantity, timeUnit, customDuration])

  const availableLabels = useMemo(
    () => availableEntries.map((e) => normalizeName(e.name.replace('.eth', ''))),
    [availableEntries]
  )
  const availableDurations = useMemo(() => {
    return availableEntries
      .map((e) => {
        const idx = entries.indexOf(e)
        const d = entryDurations[idx]
        return d ? BigInt(d) : null
      })
      .filter((d): d is bigint => d !== null)
  }, [availableEntries, entries, entryDurations])

  const allDurationsValid = availableDurations.length === availableEntries.length

  const { data: totalPriceData, isLoading: isLoadingPrice } = useQuery({
    queryKey: ['bulkTotalPrice', availableLabels.join(','), availableDurations.map(String).join(',')],
    queryFn: async () => {
      if (availableLabels.length === 0 || !allDurationsValid) return null
      return getBulkTotalPrice(availableLabels, availableDurations)
    },
    enabled: availableLabels.length > 0 && allDurationsValid,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  })

  const { data: perNamePrices } = useQuery({
    queryKey: ['bulkRentPrices', availableLabels.join(','), availableDurations.map(String).join(',')],
    queryFn: async () => {
      if (availableLabels.length === 0 || !allDurationsValid) return null
      return getBulkRentPrices(availableLabels, availableDurations)
    },
    enabled: availableLabels.length > 0 && allDurationsValid && isBulk,
    refetchInterval: 10000,
    staleTime: 5000,
  })

  const calculationResults: CalculationResults | null = useMemo(() => {
    if (entries.length === 0 || !allDurationsValid) return null

    const baseDurationSeconds = entryDurations[0]
    if (!baseDurationSeconds) return null

    let totalPriceETH: number
    let totalPriceUSD: number

    if (totalPriceData) {
      totalPriceETH = Number(totalPriceData) / 10 ** 18
      totalPriceUSD = totalPriceETH * (ethPrice || 3300)
    } else {
      // Fallback estimate
      totalPriceUSD = availableEntries.reduce((sum, entry) => {
        const dur = entryDurations[entries.indexOf(entry)]
        const years = (dur || 0) / YEAR_IN_SECONDS
        return sum + calculateDomainPriceUSD(entry.name, years)
      }, 0)
      totalPriceETH = Math.floor((totalPriceUSD / (ethPrice || 3300)) * 10 ** 6) / 10 ** 6
    }

    const anyBelowMinimum = entryDurations.some((d) => d !== null && d < MIN_REGISTRATION_DURATION)

    return {
      durationSeconds: BigInt(baseDurationSeconds),
      durationYears: baseDurationSeconds / YEAR_IN_SECONDS,
      priceUSD: totalPriceUSD,
      priceETH: totalPriceETH,
      isBelowMinimum: anyBelowMinimum,
      isLoadingPrice,
    }
  }, [entries, entryDurations, ethPrice, totalPriceData, isLoadingPrice, availableEntries])

  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || !calculationResults || !gasPrice || !gasEstimate) return false

    const totalPriceWei = BigInt(Math.floor(calculationResults.priceETH * Math.pow(10, TOKEN_DECIMALS.ETH)))
    const gasWei = gasEstimate * gasPrice
    const totalRequired = totalPriceWei + gasWei

    return ethBalance.value >= totalRequired
  }, [ethBalance, calculationResults, gasPrice, gasEstimate])

  useEffect(() => {
    if (!isClient || !registrationState.isOpen || entries.length === 0) return
    if (registrationState.flowState === 'success') return

    const checkAvailability = async () => {
      const labels = entries.map((e) => e.name.replace('.eth', ''))
      const results = await checkBulkAvailable(labels)
      dispatch(setBulkAvailability(results))
    }

    checkAvailability()
  }, [isClient, registrationState.isOpen, entries.length, registrationState.flowState])

  useEffect(() => {
    entryDurations.forEach((d, i) => {
      if (d !== null) {
        dispatch(setEntryCalculatedDuration({ index: i, duration: d.toString() }))
      }
    })
  }, [entryDurations, dispatch])

  useEffect(() => {
    if (!calculationResults || availableLabels.length === 0) return
    // Rough estimate: 500k gas per name
    setGasEstimate(BigInt(500_000) * BigInt(availableLabels.length))
  }, [calculationResults, availableLabels.length])

  useEffect(() => {
    if (registrationState.flowState !== 'waiting') return

    const lastCommittedBatch = [...batches].reverse().find((b) => b.committed && b.commitmentTimestamp)
    if (!lastCommittedBatch?.commitmentTimestamp) return

    const interval = setInterval(async () => {
      const ages = await getCommitmentAges()
      const currentTime = Math.floor(Date.now() / 1000)
      const timePassed = currentTime - (lastCommittedBatch.commitmentTimestamp || 0)
      const timeRemaining = Math.max(0, ages.min - timePassed)

      setWaitTimeRemaining(timeRemaining)

      if (timeRemaining === 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [registrationState.flowState, batches, getCommitmentAges])

  // Auto-reopen removed: when the user minimizes an active registration,
  // we show a toast instead of forcing the modal back open.

  useEffect(() => {
    const checkResume = async () => {
      if (
        entries.length === 0 ||
        !entries[0]?.domain ||
        !address ||
        !secret ||
        registrationState.flowState === 'success'
      )
        return

      // Check if any batch has a pending register tx
      const pendingRegisterBatch = batches.find((b) => b.registerTxHash && !b.registered)
      if (pendingRegisterBatch) {
        dispatch(setRegistrationFlowState('registering'))
        dispatch(setCurrentBatchIndex(pendingRegisterBatch.batchIndex))
        try {
          const receipt = await publicClient?.waitForTransactionReceipt({
            hash: pendingRegisterBatch.registerTxHash!,
            confirmations: 1,
          })
          if (receipt?.status === 'success') {
            dispatch(setBatchRegistered(pendingRegisterBatch.batchIndex))
            const allRegistered = batches.every((b) =>
              b.batchIndex === pendingRegisterBatch.batchIndex ? true : b.registered
            )
            if (allRegistered) {
              dispatch(setRegistrationFlowState('success'))
              refetchQueries()
            }
          }
        } catch (error) {
          console.error('Error resuming register tx:', error)
        }
        return
      }

      // Check if we're in the waiting step
      const lastCommittedBatch = [...batches].reverse().find((b) => b.committed && b.commitmentTimestamp)
      if (lastCommittedBatch?.commitmentTimestamp) {
        const timeSinceCommit = Math.floor(Date.now() / 1000) - lastCommittedBatch.commitmentTimestamp
        if (timeSinceCommit > 0 && timeSinceCommit < 60) {
          dispatch(setRegistrationFlowState('waiting'))
          return
        }

        if (lastCommittedBatch.commitmentHashes?.[0]) {
          const commitTimestamp = await checkCommitmentAge(lastCommittedBatch.commitmentHashes[0])
          if (commitTimestamp && commitTimestamp > 0) {
            const ages = await getCommitmentAges()
            const age = Math.floor(Date.now() / 1000) - commitTimestamp
            if (age >= ages.min && age <= ages.max) {
              dispatch(setRegistrationFlowState('waiting'))
              return
            }
          }
        }
      }

      // Check pending commit tx
      const pendingCommitBatch = batches.find((b) => b.commitTxHash && !b.committed)
      if (pendingCommitBatch) {
        dispatch(setRegistrationFlowState('committing'))
        dispatch(setCurrentBatchIndex(pendingCommitBatch.batchIndex))
        try {
          const receipt = await publicClient?.waitForTransactionReceipt({
            hash: pendingCommitBatch.commitTxHash!,
            confirmations: 1,
          })
          if (receipt?.status === 'success') {
            const timestamp = Math.floor(Date.now() / 1000)
            dispatch(
              setBatchCommitmentData({
                batchIndex: pendingCommitBatch.batchIndex,
                hashes: pendingCommitBatch.commitmentHashes || [],
                timestamp,
              })
            )
            dispatch(setBatchCommitted(pendingCommitBatch.batchIndex))
          }
        } catch (error) {
          console.error('Error resuming commit tx:', error)
        }
        return
      }
    }

    checkResume()
  }, [address, entries.length, secret])

  const handleClose = useCallback(() => {
    if (
      registrationState.flowState === 'committing' ||
      registrationState.flowState === 'registering' ||
      registrationState.flowState === 'waiting'
    ) {
      // Minimize to toast — preserves all state
      dispatch(closeRegistrationModal())
      return
    }

    dispatch(resetRegistrationModal())
  }, [registrationState.flowState, dispatch])

  const handleReopen = useCallback(() => {
    dispatch(reopenRegistrationModal())
  }, [dispatch])

  const refetchQueries = useCallback(() => {
    setTimeout(() => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.some((k) => typeof k === 'string' && k.includes('domain')),
      })
      queryClient.refetchQueries({
        predicate: (query) => query.queryKey.some((k) => typeof k === 'string' && k.includes('domain')),
      })
      queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'activity', address] })
      entries.forEach((entry) => {
        queryClient.refetchQueries({ queryKey: ['name', 'details', entry.name] })
        queryClient.refetchQueries({ queryKey: ['name', 'activity', entry.name] })
      })
    }, 2000)
  }, [queryClient, address, entries])

  const getOwnerAddress = useCallback((): `0x${string}` | null => {
    if (showCustomOwner) {
      if (isAddress(debouncedCustomOwner)) return debouncedCustomOwner as `0x${string}`
      if (isAddress(account?.address ?? '')) return account!.address as `0x${string}`
      return null
    }
    return address ?? null
  }, [showCustomOwner, debouncedCustomOwner, account, address])

  const handleCommit = useCallback(async () => {
    if (!address || entries.length === 0 || !calculationResults) return

    const owner = getOwnerAddress()
    if (!owner) {
      dispatch(setRegistrationError('Invalid owner address'))
      return
    }

    dispatch(setRegistrationFlowState('committing'))

    try {
      const commitSecret = secret || generateSecret()
      if (!secret) dispatch(setSecret(commitSecret))

      if (batches.length === 0) {
        dispatch(initializeBatches())
      }

      const localBatches =
        batches.length > 0
          ? batches
          : (() => {
              const availableIndices = entries.map((e, i) => (e.isAvailable !== false ? i : -1)).filter((i) => i !== -1)
              const result = []
              for (let i = 0; i < availableIndices.length; i += 100) {
                result.push({
                  batchIndex: result.length,
                  nameIndices: availableIndices.slice(i, i + 100),
                  commitmentHashes: null as Hex[] | null,
                  commitTxHash: null as Hex | null,
                  commitmentTimestamp: null as number | null,
                  registerTxHash: null as Hex | null,
                  committed: false,
                  registered: false,
                })
              }
              return result
            })()

      if (batches.length === 0) {
        dispatch(initializeBatches())
      }

      for (let batchIndex = 0; batchIndex < localBatches.length; batchIndex++) {
        const batch = localBatches[batchIndex]
        if (batch.committed) continue

        dispatch(setCurrentBatchIndex(batchIndex))

        const batchLabels = batch.nameIndices.map((idx) => normalizeName(entries[idx].name.replace('.eth', '')))
        const batchDurations = batch.nameIndices.map((idx) => {
          const d = entryDurations[idx]
          return BigInt(d || YEAR_IN_SECONDS)
        })

        const hashes = await makeBulkCommitments(
          batchLabels,
          owner,
          batchDurations,
          commitSecret,
          reverseRecord ? 1 : 0
        )
        dispatch(setBatchCommitmentData({ batchIndex, hashes, timestamp: 0 }))

        const tx = await submitMultiCommit(hashes)
        dispatch(setBatchCommitTxHash({ batchIndex, txHash: tx }))

        const receipt = await publicClient?.waitForTransactionReceipt({
          hash: tx,
          confirmations: 1,
        })

        if (receipt?.status === 'reverted') {
          dispatch(setRegistrationError(`Commitment transaction failed for batch ${batchIndex + 1}`))
          return
        }

        if (receipt?.status !== 'success') {
          dispatch(setRegistrationError(`Commitment transaction failed for batch ${batchIndex + 1}`))
          return
        }

        const timestamp = Math.floor(Date.now() / 1000)
        dispatch(setBatchCommitmentData({ batchIndex, hashes, timestamp }))
        dispatch(setBatchCommitted(batchIndex))
      }

      dispatch(setRegistrationFlowState('waiting'))
    } catch (error: any) {
      console.error('Failed to commit:', error)
      dispatch(setRegistrationError(error.message || 'Failed to submit commitment'))
    }
  }, [
    address,
    entries,
    calculationResults,
    getOwnerAddress,
    secret,
    batches,
    entryDurations,
    generateSecret,
    makeBulkCommitments,
    submitMultiCommit,
    publicClient,
    dispatch,
  ])

  const handleRegister = useCallback(async () => {
    if (!address || entries.length === 0 || !secret) return

    const owner = getOwnerAddress()
    if (!owner) {
      dispatch(setRegistrationError('Invalid owner address'))
      return
    }

    dispatch(setRegistrationFlowState('registering'))

    try {
      const currentBatches = batches.length > 0 ? batches : []

      for (let batchIndex = 0; batchIndex < currentBatches.length; batchIndex++) {
        const batch = currentBatches[batchIndex]
        if (batch.registered) continue

        dispatch(setCurrentBatchIndex(batchIndex))

        const batchLabels = batch.nameIndices.map((idx) => normalizeName(entries[idx].name.replace('.eth', '')))
        const batchDurations = batch.nameIndices.map((idx) => {
          const d = entryDurations[idx]
          return BigInt(d || YEAR_IN_SECONDS)
        })

        const batchPrice = await getBulkTotalPrice(batchLabels, batchDurations)
        if (!batchPrice) {
          dispatch(setRegistrationError(`Failed to get price for batch ${batchIndex + 1}`))
          return
        }
        const valueWithBuffer = (batchPrice * BigInt(105)) / BigInt(100)

        const tx = await submitMultiRegister(
          batchLabels,
          owner,
          batchDurations,
          secret,
          valueWithBuffer,
          reverseRecord ? 1 : 0
        )
        dispatch(setBatchRegisterTxHash({ batchIndex, txHash: tx }))

        const receipt = await publicClient?.waitForTransactionReceipt({
          hash: tx,
          confirmations: 1,
        })

        if (receipt?.status === 'reverted') {
          dispatch(setRegistrationError(`Registration transaction failed for batch ${batchIndex + 1}`))
          return
        }

        if (receipt?.status !== 'success') {
          dispatch(setRegistrationError(`Registration transaction failed for batch ${batchIndex + 1}`))
          return
        }

        dispatch(setBatchRegistered(batchIndex))
      }

      dispatch(setRegistrationFlowState('success'))

      entries.forEach((entry) => {
        const cartDomain =
          cartRegisteredDomains.find((d) => d.token_id === entry.domain?.token_id) ||
          cartUnregisteredDomains.find((d) => d.token_id === entry.domain?.token_id)
        if (cartDomain) {
          modifyCart({ domain: cartDomain, inCart: true, cartType: cartDomain.cartType })
        }
      })

      refetchQueries()
    } catch (error: any) {
      console.error('Failed to register:', error)
      dispatch(setRegistrationError(error.message || 'Failed to register name'))
    }
  }, [
    address,
    entries,
    secret,
    getOwnerAddress,
    batches,
    entryDurations,
    getBulkTotalPrice,
    submitMultiRegister,
    publicClient,
    cartRegisteredDomains,
    cartUnregisteredDomains,
    modifyCart,
    refetchQueries,
    dispatch,
  ])

  const onTimeUnitChange = useCallback(
    (value: string) => {
      dispatch(setTimeUnit(value as TimeUnit))
      if (value === 'custom') {
        setShowDatePicker(true)
        dispatch(setRegistrationMode('register_to'))
      } else {
        setShowDatePicker(false)
        dispatch(setRegistrationMode('register_for'))
      }
    },
    [dispatch]
  )

  const onQuantityChange = useCallback(
    (value: number) => {
      dispatch(setQuantity(value))
    },
    [dispatch]
  )

  const onCustomDateSelect = useCallback(
    (timestamp: number) => {
      const timeDelta = timestamp - Math.floor(Date.now() / 1000)
      dispatch(setCustomDuration(timeDelta))
      setShowDatePicker(false)
    },
    [dispatch]
  )

  const onSelectCustomDate = useCallback(() => {
    dispatch(setRegistrationMode('register_to'))
    dispatch(setTimeUnit('custom'))
    setShowDatePicker(true)
  }, [dispatch])

  const onEntryDurationChange = useCallback(
    (index: number, value: string) => {
      const entry = entries[index]
      const entryQty = entry?.quantity ?? quantity
      dispatch(
        setEntryDuration({
          index,
          registrationMode: value === 'custom' ? 'register_to' : 'register_for',
          quantity: entryQty,
          timeUnit: value as TimeUnit,
          customDuration: entry?.customDuration ?? customDuration,
        })
      )
      if (value === 'custom') {
        setPerNameDatePickerIndex(index)
      }
    },
    [entries, quantity, customDuration, dispatch]
  )

  const onEntryQuantityChange = useCallback(
    (index: number, value: number) => {
      const entry = entries[index]
      const entryUnit = entry?.timeUnit ?? timeUnit
      dispatch(
        setEntryDuration({
          index,
          registrationMode: 'register_for',
          quantity: value,
          timeUnit: entryUnit,
          customDuration: entry?.customDuration ?? customDuration,
        })
      )
    },
    [entries, timeUnit, customDuration, dispatch]
  )

  const onEntryDateSelect = useCallback(
    (timestamp: number) => {
      if (perNameDatePickerIndex === null) return
      const timeDelta = timestamp - Math.floor(Date.now() / 1000)
      const entry = entries[perNameDatePickerIndex]
      dispatch(
        setEntryDuration({
          index: perNameDatePickerIndex,
          registrationMode: 'register_to',
          quantity: entry?.quantity ?? quantity,
          timeUnit: 'custom',
          customDuration: timeDelta,
        })
      )
      setPerNameDatePickerIndex(null)
    },
    [perNameDatePickerIndex, entries, quantity, dispatch]
  )

  const onRetry = useCallback(() => {
    dispatch(setRegistrationFlowState('review'))
  }, [dispatch])

  const onResetModal = useCallback(() => {
    dispatch(resetRegistrationModal())
  }, [dispatch])

  return {
    isClient,
    registrationState,
    poapClaimed,
    entries,
    batches,
    isBulk,
    totalBatches,
    secret,
    registrationMode,
    quantity,
    timeUnit,
    customDuration,
    firstName,
    firstDomain,
    allNamesValid,
    allAvailabilityChecked,
    availableEntries,
    unavailableEntries,
    entryDurations,
    allDurationsValid,
    calculationResults,
    hasSufficientBalance,
    currentBatch: batches[registrationState.currentBatchIndex],
    perNamePrices,
    gasEstimate,
    gasPrice,
    showCustomOwner,
    setShowCustomOwner,
    customOwner,
    setCustomOwner,
    debouncedCustomOwner,
    account,
    isResolving,
    reverseRecord,
    setReverseRecord,
    showDatePicker,
    setShowDatePicker,
    showCancelWarning,
    setShowCancelWarning,
    waitTimeRemaining,
    showPerNameDurations,
    setShowPerNameDurations,
    perNameDatePickerIndex,
    setPerNameDatePickerIndex,
    handleClose,
    handleReopen,
    handleCommit,
    handleRegister,
    onTimeUnitChange,
    onQuantityChange,
    onCustomDateSelect,
    onSelectCustomDate,
    onEntryDurationChange,
    onEntryQuantityChange,
    onEntryDateSelect,
    onRetry,
    onResetModal,
  }
}

export default useRegistrationModal
