'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAccount, useBalance, useGasPrice, usePublicClient } from 'wagmi'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectRegistration,
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
  setV2Snapshot,
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
import useEnsV2Registrar from '@/hooks/registrar/useEnsV2Registrar'
import { useEnsV2Status } from '@/hooks/useEnsV2'
import { usePaymentToken } from '@/hooks/usePaymentToken'
import useETHPrice from '@/hooks/useETHPrice'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { YEAR_IN_SECONDS } from '@/constants/time'
import { normalizeName } from '@/lib/ens'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Hex, Address, formatUnits, isAddress, zeroAddress } from 'viem'
import { fetchAccount, useIsClient } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import { activeChain } from '@/constants/web3/chain'
import { useDebounce } from '@/hooks/useDebounce'
import { MIN_REGISTRATION_DURATION } from '@/constants/registration'
import { CalculationResults, TimeUnit } from '@/types/registration'
import { computeDurationForEntry } from '@/utils/registration'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { accountQueryKey } from '@/utils/queryKeys'

import { useResolverPreferences } from '@/hooks/ens-v2/useResolverData'
import { getOwnedResolver } from '@/utils/web3/ensv2'
import { ENS_HOLIDAY_REFERRER_ADDRESS } from '@/constants/web3/contracts'
import { assertRegistrationSnapshot } from '@/utils/web3/registration-snapshot'

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
  const publicClient = usePublicClient({ chainId: activeChain.id })
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
  const network = useEnsV2Status()
  const ensV2 = network.data ?? null
  const v2Registrar = useEnsV2Registrar()
  const { paymentToken, paymentBalance, selectPaymentToken } = usePaymentToken(!!ensV2)
  const loadCommitmentAges = () => (ensV2 ? v2Registrar.getCommitmentAges(ensV2) : getCommitmentAges())

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
    queryKey: accountQueryKey(debouncedCustomOwner),
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
  const totalBatches =
    batches.length || Math.ceil(entries.filter((entry) => entry.isAvailable !== false).length / (ensV2 ? 1 : 100))
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
  const bulkUnavailable = false
  const snapshot = registrationState.v2Snapshot
  const running = useRef(false)

  const { data: ethBalance } = useBalance({
    address,
    chainId: activeChain.id,
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
  const shouldFetchRegistrationPrices = registrationState.isOpen && registrationState.flowState === 'review'

  const { data: totalPriceData, isLoading: isLoadingPrice } = useQuery({
    queryKey: [
      'bulkTotalPrice',
      availableLabels.join(','),
      availableDurations.map(String).join(','),
      ensV2 ? paymentToken.symbol : 'ETH',
    ],
    queryFn: async () => {
      if (availableLabels.length === 0 || !allDurationsValid) return null
      if (ensV2)
        return (
          await Promise.all(
            availableLabels.map((label, index) =>
              v2Registrar.getPrice(ensV2, label, availableDurations[index], paymentToken.address)
            )
          )
        ).reduce((total, price) => total + price, BigInt(0))
      return getBulkTotalPrice(availableLabels, availableDurations)
    },
    enabled: shouldFetchRegistrationPrices && availableLabels.length > 0 && allDurationsValid,
    refetchInterval: shouldFetchRegistrationPrices ? 10000 : false,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  })

  const { data: perNamePrices } = useQuery({
    queryKey: ['bulkRentPrices', availableLabels.join(','), availableDurations.map(String).join(',')],
    queryFn: async () => {
      if (availableLabels.length === 0 || !allDurationsValid) return null
      return getBulkRentPrices(availableLabels, availableDurations)
    },
    enabled: shouldFetchRegistrationPrices && availableLabels.length > 0 && allDurationsValid && isBulk && !ensV2,
    refetchInterval: shouldFetchRegistrationPrices ? 10000 : false,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  })

  const calculationResults: CalculationResults | null = useMemo(() => {
    if (entries.length === 0 || !allDurationsValid) return null

    const baseDurationSeconds = entryDurations[0]
    if (!baseDurationSeconds) return null

    let totalPriceETH: number
    let totalPriceUSD: number

    if (ensV2) {
      totalPriceUSD = Number(formatUnits(totalPriceData ?? BigInt(0), paymentToken.decimals))
      totalPriceETH = totalPriceUSD / (ethPrice || 3300)
    } else if (totalPriceData) {
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
      isLoadingPrice: ensV2 ? !totalPriceData : isLoadingPrice,
      paymentToken: ensV2 ? paymentToken.symbol : undefined,
    }
  }, [entries, entryDurations, ethPrice, totalPriceData, isLoadingPrice, availableEntries, ensV2, paymentToken])

  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || !calculationResults || !gasPrice || !gasEstimate) return false

    const gasWei = gasEstimate * gasPrice
    if (ensV2) return !!totalPriceData && paymentBalance >= totalPriceData && ethBalance.value >= gasWei

    const totalPriceWei = BigInt(Math.floor(calculationResults.priceETH * Math.pow(10, TOKEN_DECIMALS.ETH)))
    const totalRequired = totalPriceWei + gasWei

    return ethBalance.value >= totalRequired
  }, [ethBalance, calculationResults, gasPrice, gasEstimate, ensV2, totalPriceData, paymentBalance])

  useEffect(() => {
    if (!isClient || !registrationState.isOpen || entries.length === 0 || !network.isSuccess || batches.length) return
    if (registrationState.flowState === 'success' || registrationState.flowState === 'registering') return

    let cancelled = false
    const checkAvailability = async () => {
      const labels = entries.map((e) => e.name.replace('.eth', ''))
      const results = await (ensV2
        ? v2Registrar.checkAvailable(ensV2, labels).catch(() => labels.map(() => false))
        : checkBulkAvailable(labels))
      if (!cancelled) dispatch(setBulkAvailability(results))
    }

    checkAvailability()
    return () => {
      cancelled = true
    }
  }, [
    isClient,
    registrationState.isOpen,
    entries.length,
    registrationState.flowState,
    ensV2,
    network.isSuccess,
    batches.length,
  ])

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

    let interval: ReturnType<typeof setInterval> | undefined
    let cancelled = false

    const updateRemainingTime = (minCommitmentAge: number) => {
      const currentTime = Math.floor(Date.now() / 1000)
      const timePassed = currentTime - (lastCommittedBatch.commitmentTimestamp || 0)
      const timeRemaining = Math.max(0, minCommitmentAge - timePassed)

      setWaitTimeRemaining(timeRemaining)

      if (timeRemaining === 0 && interval) {
        clearInterval(interval)
      }
    }

    loadCommitmentAges()
      .then((ages) => {
        if (cancelled) return
        updateRemainingTime(ages.min)
        interval = setInterval(() => updateRemainingTime(ages.min), 1000)
      })
      .catch(() => {
        if (!cancelled)
          dispatch(
            setRegistrationError('Could not load commitment timing. Your registration is saved; continue to retry.')
          )
      })

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [registrationState.flowState, batches, ensV2, dispatch])

  // Auto-reopen removed: when the user minimizes an active registration,
  // we show a toast instead of forcing the modal back open.

  useEffect(() => {
    const checkResume = async () => {
      if (
        running.current ||
        !network.isSuccess ||
        (snapshot &&
          (!ensV2 ||
            snapshot.sender.toLowerCase() !== address?.toLowerCase() ||
            snapshot.chainId !== activeChain.id)) ||
        entries.length === 0 ||
        !entries[0]?.domain ||
        !address ||
        !secret ||
        registrationState.flowState === 'success'
      )
        return

      if (snapshot) {
        if (registrationState.flowState !== 'review' && registrationState.flowState !== 'error')
          dispatch(setRegistrationFlowState('error'))
        dispatch(
          setRegistrationError(
            'Registration is saved. Continue to check pending transactions and resume with the original parameters.'
          )
        )
        return
      }

      // Check if any batch has a pending register tx
      const pendingRegisterBatch = batches.find((b) => b.registerTxHash && !b.registered)
      if (pendingRegisterBatch) {
        dispatch(setRegistrationFlowState('registering'))
        dispatch(setCurrentBatchIndex(pendingRegisterBatch.batchIndex))
        try {
          const receipt = publicClient
            ? await waitForTransaction(publicClient, pendingRegisterBatch.registerTxHash!)
            : undefined
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
          const commitTimestamp = await (ensV2
            ? v2Registrar.checkCommitmentAge(ensV2, lastCommittedBatch.commitmentHashes[0])
            : checkCommitmentAge(lastCommittedBatch.commitmentHashes[0]))
          if (commitTimestamp && commitTimestamp > 0) {
            const ages = await loadCommitmentAges()
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
          const receipt = publicClient
            ? await waitForTransaction(publicClient, pendingCommitBatch.commitTxHash!)
            : undefined
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
  }, [address, entries.length, ensV2, network.isSuccess])

  const handleClose = useCallback(() => {
    if (
      registrationState.flowState === 'committing' ||
      registrationState.flowState === 'registering' ||
      registrationState.flowState === 'waiting' ||
      (registrationState.flowState === 'error' && batches.length > 0)
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
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'domains'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings', 'count'] })
      queryClient.invalidateQueries({ queryKey: ['bulkSearch'] })
      queryClient.invalidateQueries({ queryKey: ['categoriesPage', 'domains'] })
      queryClient.invalidateQueries({ queryKey: ['categoriesPage', 'listings', 'count'] })
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

  const recipient = getOwnerAddress()
  const preferences = useResolverPreferences()
  const [resolverOverride, setResolverOverride] = useState<{ recipient: string; value: string } | null>(null)
  const predictedResolver = useQuery({
    queryKey: ['ens-v2-predicted', activeChain.id, recipient, ensV2?.verifiableFactory],
    enabled: !!publicClient && !!ensV2 && !!recipient,
    queryFn: () => getOwnedResolver(publicClient!, ensV2!, recipient!),
  })
  const resolverValue =
    snapshot?.resolver ??
    (resolverOverride?.recipient === recipient
      ? resolverOverride.value
      : recipient?.toLowerCase() === address?.toLowerCase() && preferences.data?.preferredResolver
        ? preferences.data.preferredResolver
        : (predictedResolver.data?.address ?? ''))
  const setResolverValue = (value: string) => setResolverOverride({ recipient: recipient ?? '', value })
  const resolverReady =
    !ensV2 || (isAddress(resolverValue) && !!recipient && (!showCustomOwner || customOwner === debouncedCustomOwner))

  const selectedResolverCode = useQuery({
    queryKey: ['resolver-code', activeChain.id, resolverValue],
    enabled: !!publicClient && !!ensV2 && isAddress(resolverValue),
    queryFn: async () => (await publicClient!.getBytecode({ address: resolverValue as Address })) ?? null,
    retry: false,
  })

  const handleCommit = useCallback(async () => {
    if (!address || !publicClient || entries.length === 0 || !network.isSuccess || running.current) return

    const owner = snapshot?.owner ?? getOwnerAddress()
    if (!owner) {
      dispatch(setRegistrationError('Invalid owner address'))
      return
    }

    running.current = true
    dispatch(setRegistrationFlowState('committing'))

    try {
      const commitSecret = secret || generateSecret()
      if (!secret) dispatch(setSecret(commitSecret))

      let saved = snapshot
      if (ensV2) {
        if (!saved && batches.length)
          throw new Error(
            'This older commitment has no saved resolver parameters. Cancel it and start a new registration.'
          )
        if (!saved) {
          if (!resolverReady || !isAddress(resolverValue))
            throw new Error('Select a valid resolver address before committing.')
          saved = {
            version: 1,
            chainId: activeChain.id,
            registrar: ensV2.ethRegistrar,
            sender: address,
            owner,
            resolver: resolverValue as Address,
            subregistry: zeroAddress,
            referrer: ENS_HOLIDAY_REFERRER_ADDRESS,
            names: entries.flatMap((entry, entryIndex) =>
              entry.isAvailable !== false
                ? [
                    {
                      label: normalizeName(entry.name.replace(/\.eth$/, '')),
                      duration: String(entryDurations[entryIndex]),
                      entryIndex,
                    },
                  ]
                : []
            ),
          }
          if (
            saved.names.some(
              (entry) => !/^\d+$/.test(entry.duration) || BigInt(entry.duration) < BigInt(MIN_REGISTRATION_DURATION)
            )
          )
            throw new Error('Review all registration durations.')
          dispatch(setV2Snapshot(saved))
        }
        assertRegistrationSnapshot(saved, activeChain.id, address, ensV2.ethRegistrar)
      } else if (saved) throw new Error('The ENSv2 network is unavailable. Your commitment has been preserved.')
      const batchSize = ensV2 ? 1 : 100
      const localBatches =
        batches.length > 0
          ? batches
          : (() => {
              const availableIndices = entries.map((e, i) => (e.isAvailable !== false ? i : -1)).filter((i) => i !== -1)
              const result = []
              for (let i = 0; i < availableIndices.length; i += batchSize) {
                result.push({
                  batchIndex: result.length,
                  nameIndices: availableIndices.slice(i, i + batchSize),
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
        dispatch(initializeBatches(batchSize))
      }

      for (let batchIndex = 0; batchIndex < localBatches.length; batchIndex++) {
        const batch = localBatches[batchIndex]
        if (batch.registered) continue
        if (batch.committed) {
          if (!ensV2 || !batch.commitmentHashes?.[0]) continue
          const at = await v2Registrar.checkCommitmentAge(ensV2, batch.commitmentHashes[0])
          if (at === null) throw new Error('Could not verify this commitment. Try continuing again.')
          const ages = await v2Registrar.getCommitmentAges(ensV2)
          if (at > 0 && Date.now() / 1000 - at <= ages.max) continue
        }

        dispatch(setCurrentBatchIndex(batchIndex))

        const batchLabels = batch.nameIndices.map((idx) => normalizeName(entries[idx].name.replace('.eth', '')))
        const batchDurations = batch.nameIndices.map((idx) => {
          const d = entryDurations[idx]
          return BigInt(d || YEAR_IN_SECONDS)
        })

        const hashes = ensV2
          ? [await v2Registrar.makeCommitment(saved!, batchIndex, commitSecret)]
          : await makeBulkCommitments(batchLabels, owner, batchDurations, commitSecret, reverseRecord ? 1 : 0)
        dispatch(setBatchCommitmentData({ batchIndex, hashes, timestamp: 0 }))

        const tx =
          batch.commitTxHash && !batch.committed
            ? batch.commitTxHash
            : await (ensV2 ? v2Registrar.commit(ensV2, hashes[0], saved!) : submitMultiCommit(hashes))
        dispatch(setBatchCommitTxHash({ batchIndex, txHash: tx }))

        const receipt = publicClient ? await waitForTransaction(publicClient, tx) : undefined

        if (receipt?.status === 'reverted') {
          dispatch(setBatchCommitTxHash({ batchIndex, txHash: null }))
          dispatch(setRegistrationError(`Commitment transaction failed for batch ${batchIndex + 1}`))
          return
        }

        if (receipt?.status !== 'success') {
          dispatch(setRegistrationError(`Commitment transaction failed for batch ${batchIndex + 1}`))
          return
        }

        const timestamp = Number((await publicClient.getBlock({ blockNumber: receipt.blockNumber })).timestamp)
        dispatch(setBatchCommitmentData({ batchIndex, hashes, timestamp }))
        dispatch(setBatchCommitted(batchIndex))
      }

      dispatch(setRegistrationFlowState('waiting'))
    } catch (error: any) {
      console.error('Failed to commit:', error)
      dispatch(setRegistrationError(error.message || 'Failed to submit commitment'))
    } finally {
      running.current = false
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
    snapshot,
    resolverValue,
    resolverReady,
    network.isSuccess,
    ensV2,
    v2Registrar,
  ])

  const handleRegister = useCallback(async () => {
    if (!address || !publicClient || entries.length === 0 || !secret || running.current) return

    const owner = snapshot?.owner ?? getOwnerAddress()
    if (!owner) {
      dispatch(setRegistrationError('Invalid owner address'))
      return
    }

    running.current = true
    dispatch(setRegistrationFlowState('registering'))

    try {
      if (ensV2) {
        if (!snapshot)
          throw new Error(
            'This commitment is missing its saved parameters. Start a new commitment instead of revealing with changed values.'
          )
        assertRegistrationSnapshot(snapshot, activeChain.id, address, ensV2.ethRegistrar)
      } else if (snapshot) throw new Error('The ENSv2 network is unavailable. Your commitment has been preserved.')
    } catch (error) {
      running.current = false
      dispatch(setRegistrationError(error instanceof Error ? error.message : 'Could not resume registration.'))
      return
    }

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

        let tx: Hex
        if (batch.registerTxHash) {
          tx = batch.registerTxHash
        } else if (ensV2) {
          if (!batch.committed || !batch.commitmentHashes?.[0])
            throw new Error('Finish committing all names before registration.')
          const expected = await v2Registrar.makeCommitment(snapshot!, batchIndex, secret)
          if (expected !== batch.commitmentHashes[0])
            throw new Error(
              'The saved commitment does not match. Registration was stopped to preserve the original parameters.'
            )
          const at = await v2Registrar.checkCommitmentAge(ensV2, expected)
          const ages = await v2Registrar.getCommitmentAges(ensV2)
          const now = Number((await publicClient.getBlock()).timestamp)
          if (!at || now - at > ages.max)
            throw new Error(
              'This commitment expired. Continue to recommit the remaining names using their saved parameters.'
            )
          if (now - at < ages.min) {
            dispatch(setRegistrationFlowState('waiting'))
            return
          }
          tx = await v2Registrar.register(ensV2, snapshot!, batchIndex, secret, paymentToken.address)
        } else {
          const batchPrice = await getBulkTotalPrice(batchLabels, batchDurations)
          if (!batchPrice) {
            dispatch(setRegistrationError(`Failed to get price for batch ${batchIndex + 1}`))
            return
          }
          const valueWithBuffer = (batchPrice * BigInt(105)) / BigInt(100)

          tx = await submitMultiRegister(
            batchLabels,
            owner,
            batchDurations,
            secret,
            valueWithBuffer,
            reverseRecord ? 1 : 0
          )
        }
        dispatch(setBatchRegisterTxHash({ batchIndex, txHash: tx }))

        const receipt = publicClient ? await waitForTransaction(publicClient, tx) : undefined

        if (receipt?.status === 'reverted') {
          dispatch(setBatchRegisterTxHash({ batchIndex, txHash: null }))
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
    } finally {
      running.current = false
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
    ensV2,
    v2Registrar,
    paymentToken,
    snapshot,
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

  const onRetry = useCallback(async () => {
    if (!snapshot) {
      dispatch(setRegistrationFlowState('review'))
      return
    }
    try {
      if (!ensV2 || !publicClient || !address)
        throw new Error('Reconnect the original registration wallet and network.')
      assertRegistrationSnapshot(snapshot, activeChain.id, address, ensV2.ethRegistrar)
      if (batches.some((batch) => batch.registerTxHash && !batch.registered)) {
        await handleRegister()
        return
      }
      const ages = await v2Registrar.getCommitmentAges(ensV2)
      const now = Number((await publicClient.getBlock()).timestamp)
      let needsCommit = batches.length === 0
      for (const batch of batches.filter((item) => !item.registered)) {
        if (!batch.committed || !batch.commitmentHashes?.[0]) {
          needsCommit = true
          break
        }
        const at = await v2Registrar.checkCommitmentAge(ensV2, batch.commitmentHashes[0])
        if (at === null) throw new Error('Could not verify the saved commitment. Try continuing again.')
        if (at === 0 || now - at > ages.max) {
          needsCommit = true
          break
        }
      }
      if (needsCommit) await handleCommit()
      else await handleRegister()
    } catch (cause) {
      dispatch(setRegistrationError(cause instanceof Error ? cause.message : 'Could not resume registration.'))
    }
  }, [dispatch, snapshot, batches, handleRegister, handleCommit, ensV2, publicClient, address, v2Registrar])

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
    isEnsV2: !!ensV2,
    paymentToken,
    selectPaymentToken,
    bulkUnavailable,
    resolverValue,
    setResolverValue,
    resolverReady,
    networkReady: network.isSuccess,
    resolverError: predictedResolver.error?.message,
    resolverWarning:
      selectedResolverCode.isSuccess && !selectedResolverCode.data
        ? 'This resolver is not deployed. Names can be registered to it, but records will not resolve until the resolver is deployed and configured.'
        : undefined,
    currentBatch: batches[registrationState.currentBatchIndex],
    perNamePrices: ensV2 ? null : perNamePrices,
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
