'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAccount, useGasPrice } from 'wagmi'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectRegistration,
  setRegistrationFlowState,
  setSecret,
  setRegistrationParameters,
  setResolverDeploymentTxHash,
  setRegistrationError,
  setRegistrationMode,
  setQuantity,
  setTimeUnit,
  setCustomDuration,
  setEntryDuration,
  clearEntryDuration,
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
import useRegisterDomains from '@/hooks/registrar/useRegisterDomains'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS, TOKENS, ZERO_ADDRESS } from '@/constants/web3/tokens'
import { DAY_IN_SECONDS, YEAR_IN_SECONDS } from '@/constants/time'
import { normalizeName } from '@/lib/ens'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Address, createPublicClient, formatUnits, Hex, http, isAddress, zeroAddress } from 'viem'
import { fetchAccount, useIsClient } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import { useDebounce } from '@/hooks/useDebounce'
import { MIN_REGISTRATION_DURATION } from '@/constants/registration'
import { CalculationResults, TimeUnit } from '@/types/registration'
import { computeDurationForEntry } from '@/utils/registration'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import { accountQueryKey } from '@/utils/queryKeys'
import { activeChain } from '@/constants/web3/chain'
import { usePermissionedResolver } from '@/hooks/resolver/usePermissionedResolver'
import { calculateDurationDiscount } from '@/utils/registrationPricing'

const useRegistrationModal = () => {
  const isClient = useIsClient()
  const dispatch = useAppDispatch()
  const { modifyCart } = useModifyCart()
  const registrationState = useAppSelector(selectRegistration)
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)
  const { address } = useAccount()
  const { data: gasPrice } = useGasPrice()
  const publicClient = createPublicClient({ chain: activeChain, transport: http() })

  const queryClient = useQueryClient()
  const {
    isApproving,
    approvalTxHash,
    generateSecret,
    checkBulkAvailable,
    getRegistrationsPrice,
    getRegistrationPricing,
    makeBulkCommitments,
    submitMultiCommit,
    submitMultiRegister,
    calculateDomainPriceUSD,
    getCommitmentAges,
    checkCommitmentAge,
  } = useRegisterDomains()
  const { isUserResolverDeployed, deployResolver, getDeployedResolver } = usePermissionedResolver()

  const parameters = registrationState.parameters
  const [selectedAsset, setAsset] = useState<Address>(TOKEN_ADDRESSES.USDC)
  const asset = parameters?.asset ?? selectedAsset
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCancelWarning, setShowCancelWarning] = useState(false)
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number>(60)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(BigInt(500000))
  const [showCustomOwner, setShowCustomOwner] = useState(false)
  const [ownerInput, setOwnerInput] = useState<{ wallet: Address; value: string } | null>(null)
  const customOwner = parameters?.owner ?? (ownerInput?.wallet === address ? ownerInput?.value : address) ?? ''
  const setCustomOwner = (value: string) => {
    if (address) setOwnerInput({ wallet: address, value })
  }
  const [resolverInput, setResolverInput] = useState<{ wallet: Address; value: string } | null>(null)
  const [isDeployingResolver, setIsDeployingResolver] = useState(false)
  const [resolverDeploymentHash, setResolverDeploymentHash] = useState<Hex | null>(null)
  const commitInFlight = useRef(false)
  const deploymentInFlight = useRef(false)
  const registrationRun = useRef(0)
  const [showPerNameDurations, setShowPerNameDurations] = useState(false)
  const [perNameDatePickerIndex, setPerNameDatePickerIndex] = useState<number | null>(null)
  const debouncedCustomOwner = useDebounce(customOwner, 500)

  const resolverQueryKey = ['registration', 'resolver', activeChain.id, address]
  const resolverQuery = useQuery({
    queryKey: resolverQueryKey,
    queryFn: () => isUserResolverDeployed(),
    enabled: !!address && registrationState.isOpen && registrationState.flowState === 'review' && !parameters,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const resolver =
    parameters?.resolver ?? (resolverInput?.wallet === address ? resolverInput?.value : resolverQuery.data || '') ?? ''
  const setResolver = (value: string) => {
    if (address) setResolverInput({ wallet: address, value })
  }
  const resolverError =
    resolver.trim() && !isAddress(resolver.trim())
      ? 'Enter a valid resolver address.'
      : !resolver.trim() && resolverQuery.isError
        ? 'Could not check your resolver. Try again or enter an address.'
        : null

  useEffect(() => {
    if (registrationState.entries.length > 0) return
    setOwnerInput(null)
    setResolverInput(null)
    setShowCustomOwner(false)
  }, [registrationState.entries.length])

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
  const registrationNames = entries.map((entry) => entry.name).join(',')
  useEffect(() => {
    registrationRun.current += 1
  }, [address, registrationNames])
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

  const { data: ethBalance } = useQuery({
    queryKey: [address, 'balance', asset],
    queryFn: async () => {
      if (!address) return
      const balance = await publicClient.token.getBalance({
        account: address,
        token: ZERO_ADDRESS,
      })

      return balance.amount
    },
  })
  const { data: assetBalance } = useQuery({
    queryKey: [address, 'balance', asset],
    queryFn: async () => {
      if (!address) return
      const balance = await publicClient.token.getBalance({
        account: address,
        token: asset,
      })

      return Number(balance.formatted)
    },
  })

  const entryDurations = useMemo(() => {
    if (parameters) return parameters.durations.map(Number)
    return entries.map((entry) => {
      const seconds = computeDurationForEntry(entry, quantity, timeUnit, customDuration)
      return seconds
    })
  }, [entries, quantity, timeUnit, customDuration, parameters])

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

  const { data: registrationPrice, isLoading: isLoadingPrice } = useQuery({
    queryKey: ['bulkRentPrices', activeChain.id, asset, availableLabels, availableDurations.map(String)],
    queryFn: async () => {
      if (availableLabels.length === 0 || !allDurationsValid) return null
      return getRegistrationsPrice(availableLabels, availableDurations, asset)
    },
    enabled: shouldFetchRegistrationPrices && availableLabels.length > 0 && allDurationsValid,
    refetchInterval: shouldFetchRegistrationPrices ? 10000 : false,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  })

  const perNamePrices = registrationPrice?.prices

  const { data: registrationPricing } = useQuery({
    queryKey: ['registrationPricing', activeChain.id, asset],
    queryFn: () => getRegistrationPricing(asset),
    enabled: shouldFetchRegistrationPrices && availableLabels.length > 0,
    refetchInterval: shouldFetchRegistrationPrices ? 10000 : false,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  })

  const calculationResults: CalculationResults | null = useMemo(() => {
    if (entries.length === 0 || !allDurationsValid) return null

    const baseDurationSeconds = entryDurations[0]
    if (!baseDurationSeconds) return null

    const discount = registrationPricing
      ? calculateDurationDiscount(availableLabels, availableDurations, registrationPricing)
      : null
    const toPaymentAmount = (value: bigint) => Number(formatUnits(value, TOKEN_DECIMALS[TOKENS[asset]]))
    const totalPriceUSD = registrationPrice
      ? toPaymentAmount(registrationPrice.total)
      : discount
        ? toPaymentAmount(discount.discountedPrice)
        : availableEntries.reduce((sum, entry) => {
            const dur = entryDurations[entries.indexOf(entry)]
            return sum + calculateDomainPriceUSD(entry.name, (dur || 0) / (DAY_IN_SECONDS * 365))
          }, 0)

    const anyBelowMinimum = entryDurations.some((d) => d !== null && d < MIN_REGISTRATION_DURATION)

    return {
      durationSeconds: BigInt(baseDurationSeconds),
      durationYears: baseDurationSeconds / YEAR_IN_SECONDS,
      priceETH: 0,
      priceUSD: totalPriceUSD,
      // Only show confirmed savings; premiums are already included in the quote and never discounted.
      durationDiscount:
        registrationPrice && discount
          ? { amount: toPaymentAmount(discount.amount), percentage: discount.percentage }
          : null,
      isBelowMinimum: anyBelowMinimum,
      isLoadingPrice,
    }
  }, [
    entries,
    entryDurations,
    allDurationsValid,
    availableLabels,
    availableDurations,
    registrationPrice,
    registrationPricing,
    isLoadingPrice,
    availableEntries,
    asset,
  ])

  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || !assetBalance || !calculationResults || !gasPrice || !gasEstimate)
      return {
        hasSufficientAssets: false,
        hasSufficientEth: false,
      }

    const hasSufficientAssets = assetBalance >= calculationResults.priceUSD

    const gasWei = gasEstimate * gasPrice
    const hasSufficientEth = ethBalance >= gasWei

    return {
      hasSufficientAssets,
      hasSufficientEth,
    }
  }, [assetBalance, calculationResults, gasPrice, gasEstimate])

  useEffect(() => {
    if (!isClient || !registrationState.isOpen || entries.length === 0) return
    if (registrationState.flowState === 'success' || registrationState.flowState === 'registering') return

    const checkAvailability = async () => {
      const labels = entries.map((e) => e.name.replace('.eth', ''))
      console.log(labels)
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

  const lastCommitmentTimestamp = [...batches]
    .reverse()
    .find((b) => b.committed && b.commitmentTimestamp)?.commitmentTimestamp

  useEffect(() => {
    if (registrationState.flowState !== 'waiting' || !lastCommitmentTimestamp) return

    let interval: ReturnType<typeof setInterval> | undefined
    let cancelled = false

    const updateRemainingTime = (minCommitmentAge: number) => {
      const currentTime = Math.floor(Date.now() / 1000)
      const timePassed = currentTime - lastCommitmentTimestamp
      const timeRemaining = Math.max(0, minCommitmentAge - timePassed)

      setWaitTimeRemaining(timeRemaining)

      if (timeRemaining === 0 && interval) {
        clearInterval(interval)
      }
    }

    getCommitmentAges().then((ages) => {
      if (cancelled) return
      interval = setInterval(() => updateRemainingTime(ages.min), 1000)
      updateRemainingTime(ages.min)
    })

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [registrationState.flowState, lastCommitmentTimestamp, getCommitmentAges])

  // Auto-reopen removed: when the user minimizes an active registration,
  // we show a toast instead of forcing the modal back open.

  useEffect(() => {
    const checkResume = async () => {
      // A reload before the commitment was submitted can safely return to review.
      if (
        registrationState.flowState === 'committing' &&
        !commitInFlight.current &&
        !batches.some((b) => b.commitTxHash)
      ) {
        dispatch(setRegistrationFlowState('review'))
      }
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
          const receipt = publicClient
            ? await waitForTransaction(publicClient, pendingRegisterBatch.registerTxHash!)
            : undefined
          if (receipt?.status === 'success') {
            refreshEnsQueries(queryClient, receipt)
            dispatch(setBatchRegistered(pendingRegisterBatch.batchIndex))
            const allRegistered = batches.every((b) =>
              b.batchIndex === pendingRegisterBatch.batchIndex ? true : b.registered
            )
            if (allRegistered) {
              dispatch(setRegistrationFlowState('success'))
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
  }, [address, entries.length, secret])

  const handleClose = useCallback(() => {
    if (
      registrationState.flowState === 'resolver' ||
      registrationState.flowState === 'committing' ||
      registrationState.flowState === 'registering' ||
      registrationState.flowState === 'waiting'
    ) {
      // Minimize to toast — preserves all state
      dispatch(closeRegistrationModal())
      return
    }

    registrationRun.current += 1
    dispatch(resetRegistrationModal())
  }, [registrationState.flowState, dispatch])

  const handleReopen = useCallback(() => {
    dispatch(reopenRegistrationModal())
  }, [dispatch])

  const getOwnerAddress = useCallback((): `0x${string}` | null => {
    const value = customOwner.trim()
    if (value) {
      if (isAddress(value)) return value
      if (value !== debouncedCustomOwner.trim()) return null
      if (isAddress(account?.address ?? '')) return account!.address as `0x${string}`
      return null
    }
    return address ?? null
  }, [customOwner, debouncedCustomOwner, account, address])

  const handleCommit = useCallback(
    async (chosenResolver?: Address) => {
      if (!address || entries.length === 0 || !calculationResults || commitInFlight.current) return

      const owner = parameters?.owner ?? getOwnerAddress()
      if (!owner) {
        dispatch(setRegistrationError('Invalid owner address'))
        return
      }

      if (
        parameters &&
        (parameters.account.toLowerCase() !== address.toLowerCase() || parameters.chainId !== activeChain.id)
      ) {
        dispatch(setRegistrationError('Reconnect the wallet and network used to start this registration.'))
        return
      }
      if (!parameters && batches.some((batch) => batch.commitmentHashes?.length)) {
        dispatch(setRegistrationError('This saved registration has no resolver details. Close it and start again.'))
        return
      }
      if (resolver.trim() && !isAddress(resolver.trim())) {
        dispatch(setRegistrationError('Enter a valid resolver address.'))
        return
      }

      commitInFlight.current = true
      const run = registrationRun.current
      dispatch(setRegistrationFlowState('committing'))

      try {
        const selectedResolver =
          chosenResolver ??
          parameters?.resolver ??
          (resolver.trim() ? (resolver.trim() as Address) : await isUserResolverDeployed())
        if (run !== registrationRun.current) return

        const commitmentParameters = {
          account: address,
          chainId: activeChain.id,
          owner,
          durations: entryDurations.map((duration) => String(duration || YEAR_IN_SECONDS)),
          asset,
          ...parameters,
          resolver: selectedResolver || null,
        }
        dispatch(setRegistrationParameters(commitmentParameters))

        if (!selectedResolver) {
          dispatch(setRegistrationFlowState('resolver'))
          return
        }

        const commitSecret = secret || generateSecret()
        if (!secret) dispatch(setSecret(commitSecret))

        if (batches.length === 0) {
          dispatch(initializeBatches())
        }

        const localBatches =
          batches.length > 0
            ? batches
            : (() => {
                const availableIndices = entries
                  .map((e, i) => (e.isAvailable !== false ? i : -1))
                  .filter((i) => i !== -1)
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

        for (let batchIndex = 0; batchIndex < localBatches.length; batchIndex++) {
          if (run !== registrationRun.current) return
          const batch = localBatches[batchIndex]
          if (batch.committed) continue

          dispatch(setCurrentBatchIndex(batchIndex))

          const batchLabels = batch.nameIndices.map((idx) => normalizeName(entries[idx].name.replace('.eth', '')))
          const batchDurations = batch.nameIndices.map((idx) => {
            const d = entryDurations[idx]
            return BigInt(d || YEAR_IN_SECONDS)
          })

          const hashes = await makeBulkCommitments(batchLabels, owner, batchDurations, commitSecret, selectedResolver)
          if (run !== registrationRun.current) return
          dispatch(setBatchCommitmentData({ batchIndex, hashes, timestamp: 0 }))

          const tx = await submitMultiCommit(hashes)
          if (run !== registrationRun.current) return
          dispatch(setBatchCommitTxHash({ batchIndex, txHash: tx }))

          const receipt = publicClient ? await waitForTransaction(publicClient, tx) : undefined
          if (run !== registrationRun.current) return

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
        if (run !== registrationRun.current) return
        console.error('Failed to commit:', error)
        dispatch(setRegistrationError(error.message || 'Failed to submit commitment'))
      } finally {
        commitInFlight.current = false
      }
    },
    [
      address,
      entries,
      calculationResults,
      getOwnerAddress,
      parameters,
      resolver,
      asset,
      isUserResolverDeployed,
      secret,
      batches,
      entryDurations,
      generateSecret,
      makeBulkCommitments,
      submitMultiCommit,
      publicClient,
      dispatch,
    ]
  )

  const handleDeployResolver = async () => {
    if (!address || !parameters || deploymentInFlight.current) return
    if (parameters.account.toLowerCase() !== address.toLowerCase() || parameters.chainId !== activeChain.id) {
      dispatch(setRegistrationError('Reconnect the wallet and network used to start this registration.'))
      return
    }

    deploymentInFlight.current = true
    setIsDeployingResolver(true)
    dispatch(setRegistrationFlowState('resolver'))
    const run = registrationRun.current
    let deploymentHash = registrationState.resolverDeploymentTxHash ?? null

    try {
      const deployedResolver = registrationState.resolverDeploymentTxHash
        ? await getDeployedResolver(registrationState.resolverDeploymentTxHash)
        : (await isUserResolverDeployed()) ||
          (await deployResolver(0, (hash) => {
            deploymentHash = hash
            if (run === registrationRun.current) dispatch(setResolverDeploymentTxHash(hash))
          }))
      if (run !== registrationRun.current) return
      queryClient.setQueryData(resolverQueryKey, deployedResolver)
      setResolver(deployedResolver)
      setResolverDeploymentHash(deploymentHash)
      // Stays on the resolver step: it shows the deployment as done, and Register starts the commitment.
      dispatch(setRegistrationParameters({ ...parameters, resolver: deployedResolver }))
      dispatch(setResolverDeploymentTxHash(null))
    } catch (error) {
      if (run !== registrationRun.current) return
      dispatch(setResolverDeploymentTxHash(null))
      dispatch(setRegistrationError(error instanceof Error ? error.message : 'Failed to deploy resolver'))
    } finally {
      deploymentInFlight.current = false
      setIsDeployingResolver(false)
    }
  }

  useEffect(() => {
    if (registrationState.flowState === 'resolver' && registrationState.resolverDeploymentTxHash) {
      void handleDeployResolver()
    }
  }, [address, registrationState.resolverDeploymentTxHash])

  const handleRegister = useCallback(async () => {
    if (!address || entries.length === 0 || !secret) return

    if (!parameters?.resolver) {
      dispatch(setRegistrationError('The committed resolver is missing. Close this registration and start again.'))
      return
    }
    if (parameters.account.toLowerCase() !== address.toLowerCase() || parameters.chainId !== activeChain.id) {
      dispatch(setRegistrationError('Reconnect the wallet and network used to start this registration.'))
      return
    }
    const { owner, resolver: committedResolver } = parameters

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

        const registrationPrice = await getRegistrationsPrice(batchLabels, batchDurations, asset)
        const totalPrice = registrationPrice?.total
        if (!totalPrice) {
          dispatch(setRegistrationError(`Failed to get price for batch ${batchIndex + 1}`))
          return
        }
        const valueWithBuffer = (totalPrice * BigInt(105)) / BigInt(100)

        const tx = await submitMultiRegister(
          batchLabels,
          owner,
          batchDurations,
          secret,
          valueWithBuffer,
          asset,
          committedResolver
        )
        dispatch(setBatchRegisterTxHash({ batchIndex, txHash: tx }))

        const receipt = publicClient ? await waitForTransaction(publicClient, tx) : undefined

        if (receipt?.status === 'reverted') {
          dispatch(setRegistrationError(`Registration transaction failed for batch ${batchIndex + 1}`))
          return
        }

        if (receipt?.status !== 'success') {
          dispatch(setRegistrationError(`Registration transaction failed for batch ${batchIndex + 1}`))
          return
        }

        refreshEnsQueries(queryClient, receipt)
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
    } catch (error: any) {
      console.error('Failed to register:', error)
      dispatch(setRegistrationError(error.message || 'Failed to register name'))
    }
  }, [
    address,
    entries,
    secret,
    parameters,
    asset,
    getRegistrationsPrice,
    batches,
    entryDurations,
    submitMultiRegister,
    publicClient,
    cartRegisteredDomains,
    cartUnregisteredDomains,
    modifyCart,
    queryClient,
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

  // Drops a name's own duration so it follows the base duration again
  const onEntryDurationReset = useCallback(
    (index: number) => {
      dispatch(clearEntryDuration(index))
    },
    [dispatch]
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
    dispatch(setRegistrationFlowState(parameters?.resolver === null ? 'resolver' : 'review'))
  }, [dispatch, parameters])

  const onResetModal = useCallback(() => {
    registrationRun.current += 1
    dispatch(resetRegistrationModal())
  }, [dispatch])

  return {
    isClient,
    isApproving,
    approvalTxHash,
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
    asset,
    setAsset,
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
    resolver,
    setResolver,
    resolverError,
    isCheckingResolver: resolverQuery.isLoading && !resolver.trim(),
    isDeployingResolver,
    isResolverDeployed:
      registrationState.flowState === 'resolver' && !!parameters?.resolver && parameters.resolver !== zeroAddress,
    resolverDeploymentHash,
    handleDeployResolver,
    handleSkipResolver: () => {
      if (!deploymentInFlight.current) return handleCommit(zeroAddress)
    },
    handleResolverBack: () => {
      dispatch(setRegistrationParameters(null))
      dispatch(setRegistrationFlowState('review'))
    },
    hasRegistrationParameters: !!parameters,
    debouncedCustomOwner,
    account,
    isResolving,
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
    handleCommit: () => handleCommit(),
    handleRegister,
    onTimeUnitChange,
    onQuantityChange,
    onCustomDateSelect,
    onSelectCustomDate,
    onEntryDurationChange,
    onEntryQuantityChange,
    onEntryDateSelect,
    onEntryDurationReset,
    onRetry,
    onResetModal,
  }
}

export default useRegistrationModal
