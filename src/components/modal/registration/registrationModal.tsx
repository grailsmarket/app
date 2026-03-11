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
  resetRegistrationModal,
  TimeUnit,
  NameRegistrationEntry,
} from '@/state/reducers/registration'
import useBulkRegisterDomains from '@/hooks/registrar/useBulkRegisterDomains'
import useETHPrice from '@/hooks/useETHPrice'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Input from '@/components/ui/input'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import DatePicker from '@/components/ui/datepicker'
import NameImage from '@/components/ui/nameImage'
import { DAY_IN_SECONDS, YEAR_IN_SECONDS } from '@/constants/time'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { cn } from '@/utils/tailwind'
import { beautifyName, normalizeName } from '@/lib/ens'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Hex, isAddress } from 'viem'
import { Avatar, fetchAccount, LoadingCell, useIsClient } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import Link from 'next/link'
import ClaimPoap from '../poap/claimPoap'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import Image from 'next/image'
import Calendar from 'public/icons/calendar.svg'
import CalendarBlackIcon from 'public/icons/calendar-black.svg'
import ArrowDownIcon from 'public/icons/arrow-down.svg'
import { CAN_CLAIM_POAP } from '@/constants'
import { mainnet } from 'viem/chains'
import { useDebounce } from '@/hooks/useDebounce'

const MIN_REGISTRATION_DURATION = 28 * DAY_IN_SECONDS // 28 days minimum

const timeUnitOptions: DropdownOption[] = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
  { value: 'custom', label: 'Custom' },
]

const getSecondsPerUnit = (unit: TimeUnit): number => {
  switch (unit) {
    case 'days':
      return DAY_IN_SECONDS
    case 'weeks':
      return DAY_IN_SECONDS * 7
    case 'months':
      return DAY_IN_SECONDS * 30
    case 'years':
      return DAY_IN_SECONDS * 365
    case 'custom':
      return 0
    default:
      return DAY_IN_SECONDS * 365
  }
}

function computeDurationForEntry(
  entry: NameRegistrationEntry,
  baseQuantity: number,
  baseTimeUnit: TimeUnit,
  baseCustomDuration: number
): number | null {
  const unit = entry.timeUnit ?? baseTimeUnit
  const qty = entry.quantity ?? baseQuantity
  const custom = entry.customDuration ?? baseCustomDuration

  if (unit === 'custom') {
    if (!custom || custom === 0) return null
    return custom > 0 ? custom : null
  } else {
    return qty * getSecondsPerUnit(unit)
  }
}

const RegistrationModal: React.FC = () => {
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

  const calculationResults = useMemo(() => {
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
      totalPriceUSD = availableEntries.reduce((sum, entry, i) => {
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

  // Store calculated durations
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

  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || !calculationResults || !gasPrice || !gasEstimate) return false

    const totalPriceWei = BigInt(Math.floor(calculationResults.priceETH * Math.pow(10, TOKEN_DECIMALS.ETH)))
    const gasWei = gasEstimate * gasPrice
    const totalRequired = totalPriceWei + gasWei

    return ethBalance.value >= totalRequired
  }, [ethBalance, calculationResults, gasPrice, gasEstimate])

  // Handle wait timer
  useEffect(() => {
    if (registrationState.flowState !== 'waiting') return

    // Find the last committed batch's timestamp
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

  // Automatically open the modal if we have a registration in progress after page refresh
  useEffect(() => {
    if (
      !registrationState.isOpen &&
      entries.length > 0 &&
      entries[0]?.domain &&
      registrationState.flowState !== 'review' &&
      registrationState.flowState !== 'success' &&
      registrationState.flowState !== 'error'
    ) {
      console.log('Restoring in-progress registration for:', entries.map((e) => e.name).join(', '))
      dispatch(openRegistrationModal({ name: entries[0].name, domain: entries[0].domain }))
    }
  }, [registrationState.isOpen, entries, registrationState.flowState, dispatch])

  const handleClose = () => {
    if (
      registrationState.flowState === 'committing' ||
      registrationState.flowState === 'registering' ||
      registrationState.flowState === 'waiting'
    )
      return

    dispatch(resetRegistrationModal())
  }

  const refetchQueries = () => {
    setTimeout(() => {
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.some((k) => typeof k === 'string' && k.includes('domain')),
      })
      queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'activity', address] })
      entries.forEach((entry) => {
        queryClient.refetchQueries({ queryKey: ['name', 'details', entry.name] })
        queryClient.refetchQueries({ queryKey: ['name', 'activity', entry.name] })
      })
    }, 2000)
  }

  const getOwnerAddress = useCallback((): `0x${string}` | null => {
    if (showCustomOwner) {
      if (isAddress(debouncedCustomOwner)) return debouncedCustomOwner as `0x${string}`
      if (isAddress(account?.address ?? '')) return account!.address as `0x${string}`
      return null
    }
    return address ?? null
  }, [showCustomOwner, debouncedCustomOwner, account, address])

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
            // Check if all batches registered
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

      // Check if we're in the waiting window
      const lastCommittedBatch = [...batches].reverse().find((b) => b.committed && b.commitmentTimestamp)
      if (lastCommittedBatch?.commitmentTimestamp) {
        const timeSinceCommit = Math.floor(Date.now() / 1000) - lastCommittedBatch.commitmentTimestamp
        if (timeSinceCommit > 0 && timeSinceCommit < 60) {
          dispatch(setRegistrationFlowState('waiting'))
          return
        }

        // Check if commitments are still valid
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

  const handleCommit = async () => {
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

      // Initialize batches if not already done
      if (batches.length === 0) {
        dispatch(initializeBatches())
      }

      // We need to read from redux after dispatch, so we compute batches locally
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

      // If batches were just initialized, also dispatch
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

        const hashes = await makeBulkCommitments(batchLabels, owner, batchDurations, commitSecret)
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
  }

  const handleRegister = async () => {
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

        // Get total price for the batch + 5% buffer
        const batchPrice = await getBulkTotalPrice(batchLabels, batchDurations)
        if (!batchPrice) {
          dispatch(setRegistrationError(`Failed to get price for batch ${batchIndex + 1}`))
          return
        }
        const valueWithBuffer = (batchPrice * BigInt(105)) / BigInt(100)

        const tx = await submitMultiRegister(batchLabels, owner, batchDurations, secret, valueWithBuffer)
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

      // Remove registered names from cart
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
  }

  if (!registrationState.isOpen || entries.length === 0 || !firstDomain || !isClient) return null

  if (allAvailabilityChecked && availableEntries.length === 0) {
    return (
      <div
        onClick={handleClose}
        className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4'
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className='border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-4 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2'
        >
          <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
            <h2 className='font-sedan-sc text-center text-3xl'>
              {isBulk ? 'Names Not Available' : 'Name Not Available'}
            </h2>
          </div>
          <div className='flex flex-col items-center gap-4 py-8'>
            <p className='text-center text-lg'>
              {isBulk ? (
                <>None of the selected names are available for registration.</>
              ) : (
                <>
                  The name <span className='font-bold'>{beautifyName(firstName!)}</span> is not available for
                  registration.
                </>
              )}
            </p>
          </div>
          <SecondaryButton onClick={() => dispatch(resetRegistrationModal())} className='w-full'>
            Close
          </SecondaryButton>
        </div>
      </div>
    )
  }

  if (showCancelWarning) {
    return (
      <div
        onClick={handleClose}
        className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4'
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className='border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-4 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2'
        >
          <h2 className='font-sedan-sc text-center text-3xl'>Cancel Registration</h2>
          <p className='text-center font-medium'>
            Are you sure you want to cancel this registration? You will lose your commitment and have to start over.
          </p>
          <div className='flex flex-col items-center gap-2'>
            <SecondaryButton onClick={() => setShowCancelWarning(false)} className='w-full'>
              Continue
            </SecondaryButton>
            <SecondaryButton
              onClick={() => {
                dispatch(resetRegistrationModal())
                setShowCancelWarning(false)
              }}
              className='w-full bg-red-500!'
            >
              Cancel Registration
            </SecondaryButton>
          </div>
        </div>
      </div>
    )
  }

  if (registrationState.flowState === 'success' && CAN_CLAIM_POAP && !poapClaimed && !isBulk) {
    return (
      <div className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4'>
        <div
          onClick={(e) => e.stopPropagation()}
          className='border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-4 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2'
        >
          <ClaimPoap />
        </div>
      </div>
    )
  }

  const currentBatch = batches[registrationState.currentBatchIndex]
  // const committedBatchCount = batches.filter((b) => b.committed).length
  // const registeredBatchCount = batches.filter((b) => b.registered).length

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (
          registrationState.flowState === 'waiting' ||
          registrationState.flowState === 'committing' ||
          registrationState.flowState === 'registering'
        )
          return
        handleClose()
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2',
          (showDatePicker || perNameDatePickerIndex !== null) && 'min-h-[480px]'
        )}
      >
        <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
          <h2 className='font-sedan-sc text-center text-3xl'>{isBulk ? 'Register Names' : 'Register Name'}</h2>
        </div>
        {registrationState.flowState === 'review' && (
          <>
            {!isBulk && (
              <div className='flex items-center justify-between gap-2'>
                <p className='font-sedan-sc text-center text-2xl'>Name</p>
                <p className='text-center text-xl font-bold'>{beautifyName(firstName!)}</p>
              </div>
            )}
            {unavailableEntries.length > 0 && (
              <div className='rounded-lg border border-amber-500/20 bg-amber-900/20 p-3'>
                <p className='text-md text-amber-400'>
                  {unavailableEntries.length} name{unavailableEntries.length > 1 ? 's are' : ' is'} not available and
                  will be excluded: {unavailableEntries.map((e) => beautifyName(e.name)).join(', ')}
                </p>
              </div>
            )}
          </>
        )}
        {registrationState.flowState === 'success' ? (
          <div className='flex flex-col items-center gap-4'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <h3 className='text-2xl font-bold'>Registration Successful!</h3>
              {!isBulk && firstName ? (
                <Link href={`/${firstName}`} className='py-1 transition-opacity hover:opacity-70' onClick={handleClose}>
                  <NameImage
                    name={firstName}
                    tokenId={firstDomain?.token_id}
                    expiryDate={new Date(
                      Number(calculationResults?.durationSeconds ?? BigInt(YEAR_IN_SECONDS)) * 1000 + Date.now()
                    ).toISOString()}
                    className='h-48 w-48 rounded-lg'
                    height={192}
                    width={192}
                  />
                </Link>
              ) : (
                <p className='text-lg font-medium'>{availableEntries.length} names registered</p>
              )}
              {batches
                .filter((b) => b.registerTxHash)
                .map((b, i) => (
                  <a
                    key={b.batchIndex}
                    href={`https://etherscan.io/tx/${b.registerTxHash}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                  >
                    {totalBatches > 1 ? `Transaction ${i + 1} on Etherscan` : 'View Transaction on Etherscan'}
                  </a>
                ))}
            </div>
            <SecondaryButton onClick={handleClose} className='w-full'>
              Close
            </SecondaryButton>
          </div>
        ) : registrationState.flowState === 'error' ? (
          <div className='flex flex-col gap-4'>
            <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <p className='text-sm text-red-400'>{registrationState.errorMessage}</p>
            </div>
            <SecondaryButton
              onClick={() => {
                dispatch(setRegistrationFlowState('review'))
              }}
              className='w-full'
            >
              Try Again
            </SecondaryButton>
            <SecondaryButton onClick={handleClose} className='w-full'>
              Close
            </SecondaryButton>
          </div>
        ) : registrationState.flowState === 'committing' ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='mt-4 text-center text-xl font-bold'>Submitting Commitment{totalBatches > 1 ? 's' : ''}</h2>
            {totalBatches > 1 && (
              <p className='text-neutral text-center text-lg'>
                Transaction {registrationState.currentBatchIndex + 1} of {totalBatches}
              </p>
            )}
            <p className='text-center text-lg'>
              Committing {currentBatch?.nameIndices.length ?? availableEntries.length} name
              {(currentBatch?.nameIndices.length ?? availableEntries.length) > 1 ? 's' : ''}...
            </p>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              {currentBatch?.commitTxHash ? (
                <a
                  href={`https://etherscan.io/tx/${currentBatch.commitTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              ) : (
                <p className='text-neutral text-lg'>Please confirm the transaction in your wallet</p>
              )}
            </div>
            <SecondaryButton onClick={() => setShowCancelWarning(true)} className='w-full'>
              Cancel
            </SecondaryButton>
          </div>
        ) : registrationState.flowState === 'waiting' ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='text-center text-xl font-bold'>Waiting Period</h2>
            {waitTimeRemaining > 0 ? (
              <>
                <div className='flex flex-col items-center justify-center gap-4'>
                  <div className='relative h-32 w-32'>
                    <svg className='h-32 w-32 -rotate-90 transform'>
                      <circle
                        cx='64'
                        cy='64'
                        r='60'
                        stroke='currentColor'
                        strokeWidth='8'
                        fill='none'
                        className='text-tertiary'
                      />
                      <circle
                        cx='64'
                        cy='64'
                        r='60'
                        stroke='currentColor'
                        strokeWidth='8'
                        fill='none'
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (waitTimeRemaining / 60)}`}
                        className='text-primary transition-all duration-1000 ease-linear'
                      />
                    </svg>
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <span className='text-4xl font-bold tabular-nums'>{waitTimeRemaining}s</span>
                    </div>
                  </div>
                  <p className='text-center text-lg'>This prevents others from front-running your registration.</p>
                  {batches
                    .filter((b) => b.commitTxHash)
                    .map((b, i) => (
                      <a
                        key={b.batchIndex}
                        href={`https://etherscan.io/tx/${b.commitTxHash}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-primary hover:text-primary/80 text-md underline transition-colors'
                      >
                        {totalBatches > 1 ? `Commitment ${i + 1}` : 'Commitment Transaction'}
                      </a>
                    ))}
                </div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center gap-4 pb-4'>
                <p className='font-medium'>
                  {isBulk ? (
                    <>{availableEntries.length} names are ready for registration.</>
                  ) : (
                    <>
                      <span className='font-bold'>{beautifyName(firstName!)}</span> is ready for registration.
                    </>
                  )}
                </p>
              </div>
            )}
            <div className='flex flex-col gap-2'>
              <PrimaryButton onClick={handleRegister} disabled={waitTimeRemaining > 0} className='w-full'>
                {waitTimeRemaining > 0 ? `Wait ${waitTimeRemaining} seconds...` : 'Complete Registration'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setShowCancelWarning(true)} className='w-full'>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        ) : registrationState.flowState === 'registering' ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='mt-4 text-center text-xl font-bold'>Completing Registration</h2>
            {totalBatches > 1 && (
              <p className='text-neutral text-center text-lg'>
                Transaction {registrationState.currentBatchIndex + 1} of {totalBatches}
              </p>
            )}
            <p className='text-center text-lg'>
              Registering {currentBatch?.nameIndices.length ?? availableEntries.length} name
              {(currentBatch?.nameIndices.length ?? availableEntries.length) > 1 ? 's' : ''}...
            </p>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              {currentBatch?.registerTxHash ? (
                <a
                  href={`https://etherscan.io/tx/${currentBatch.registerTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              ) : (
                <p className='text-neutral text-lg'>Please confirm the registration transaction</p>
              )}
            </div>
            <SecondaryButton onClick={() => setShowCancelWarning(true)} className='w-full'>
              Cancel
            </SecondaryButton>
          </div>
        ) : (
          <div className='flex w-full flex-col gap-2 sm:gap-2'>
            <div className='flex w-full flex-row gap-2'>
              <Dropdown
                label='Unit'
                hideLabel={true}
                options={timeUnitOptions}
                value={timeUnit}
                onSelect={(value) => {
                  dispatch(setTimeUnit(value as TimeUnit))
                  if (value === 'custom') {
                    setShowDatePicker(true)
                    dispatch(setRegistrationMode('register_to'))
                  } else {
                    setShowDatePicker(false)
                    dispatch(setRegistrationMode('register_for'))
                  }
                }}
                className='w-2/5'
              />
              {registrationMode === 'register_for' ? (
                <Input
                  type='number'
                  label='Quantity'
                  placeholder='Number'
                  min={1}
                  hideLabel={true}
                  className='w-3/5'
                  value={quantity || ''}
                  onChange={(e) => dispatch(setQuantity(Number(e.target.value)))}
                />
              ) : (
                <>
                  <PrimaryButton onClick={() => setShowDatePicker(true)} className='h-12! w-full'>
                    {customDuration
                      ? new Date(customDuration * 1000 + Date.now()).toLocaleDateString(navigator.language || 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Select Date'}
                  </PrimaryButton>
                  {showDatePicker && (
                    <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'>
                      <DatePicker
                        onSelect={(timestamp) => {
                          const timeDelta = timestamp - Math.floor(Date.now() / 1000)
                          dispatch(setCustomDuration(timeDelta))
                          setShowDatePicker(false)
                        }}
                        onClose={() => setShowDatePicker(false)}
                        className='w-full max-w-sm'
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => {
                dispatch(setRegistrationMode('register_to'))
                dispatch(setTimeUnit('custom'))
                setShowDatePicker(true)
              }}
              className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
            >
              <p>Select a custom date</p>
              <Image src={Calendar} alt='calendar' width={18} height={18} />
            </button>
            {isBulk && (
              <div className='flex flex-col gap-2 rounded-md'>
                <div
                  onClick={() => setShowPerNameDurations(!showPerNameDurations)}
                  className='bg-secondary hover:bg-tertiary border-tertiary flex cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors'
                >
                  <p className='text-xl font-semibold'>Edit registration durations</p>
                  <div className='flex items-center gap-2'>
                    <p className='text-xl font-bold'>{availableEntries.length}</p>
                    <Image
                      src={ArrowDownIcon}
                      alt='Arrow Down'
                      width={16}
                      height={16}
                      className={cn(showPerNameDurations ? 'rotate-180' : '')}
                    />
                  </div>
                </div>
                {showPerNameDurations && (
                  <div className='flex max-h-60 flex-col gap-2 overflow-y-auto'>
                    {entries.map((entry, index) => {
                      const entryUnit = entry.timeUnit ?? timeUnit
                      const entryMode = entryUnit === 'custom' ? 'register_to' : 'register_for'
                      const entryQty = entry.quantity ?? quantity
                      const dur = entryDurations[index]
                      const isBelowMin = dur !== null && dur < MIN_REGISTRATION_DURATION
                      const perNamePrice =
                        perNamePrices && availableEntries.indexOf(entry) >= 0
                          ? perNamePrices[availableEntries.indexOf(entry)]
                          : null

                      return (
                        <div key={index} className='border-tertiary flex flex-col gap-1.5 rounded-md border p-2'>
                          <div className='flex items-center justify-between'>
                            <p className='max-w-2/3 truncate font-semibold'>{beautifyName(entry.name)}</p>
                            <div className='flex items-center gap-2'>
                              {entry.isAvailable === false && (
                                <span className='text-sm font-medium text-red-400'>Unavailable</span>
                              )}
                              {entry.isAvailable === true && (
                                <span className='text-sm font-medium text-green-400'>Available</span>
                              )}
                              {entry.isAvailable === null && (
                                <span className='text-neutral text-sm font-medium'>Checking...</span>
                              )}
                              {perNamePrice && (
                                <span className='text-neutral text-sm font-medium'>
                                  {(Number(perNamePrice) / 10 ** 18).toFixed(4)} ETH
                                </span>
                              )}
                            </div>
                          </div>
                          {entry.isAvailable !== false && (
                            <div className='flex w-full gap-2'>
                              <Dropdown
                                label='Unit'
                                hideLabel={true}
                                options={timeUnitOptions}
                                value={entryUnit}
                                onSelect={(value) => {
                                  dispatch(
                                    setEntryDuration({
                                      index,
                                      registrationMode: value === 'custom' ? 'register_to' : 'register_for',
                                      quantity: entryQty,
                                      timeUnit: value as TimeUnit,
                                      customDuration: entry.customDuration ?? customDuration,
                                    })
                                  )
                                  if (value === 'custom') {
                                    setPerNameDatePickerIndex(index)
                                  }
                                }}
                                className='w-2/5'
                              />
                              {entryMode === 'register_for' && (
                                <Input
                                  type='number'
                                  label='Qty'
                                  placeholder='Qty'
                                  min={1}
                                  hideLabel={true}
                                  className='w-3/5'
                                  value={entryQty || ''}
                                  onChange={(e) =>
                                    dispatch(
                                      setEntryDuration({
                                        index,
                                        registrationMode: 'register_for',
                                        quantity: Number(e.target.value),
                                        timeUnit: entryUnit,
                                        customDuration: entry.customDuration ?? customDuration,
                                      })
                                    )
                                  }
                                />
                              )}
                              <PrimaryButton
                                onClick={() => setPerNameDatePickerIndex(index)}
                                className={cn(
                                  'flex h-12! min-w-12! items-center justify-center p-0!',
                                  entryMode === 'register_for' ? 'min-w-12!' : 'w-3/5'
                                )}
                              >
                                {entryUnit === 'custom' && entry.customDuration ? (
                                  new Date(entry.customDuration * 1000 + Date.now()).toLocaleDateString()
                                ) : (
                                  <Image
                                    src={CalendarBlackIcon}
                                    alt='calendar'
                                    width={32}
                                    height={32}
                                    className='h-6 w-6'
                                  />
                                )}
                              </PrimaryButton>
                            </div>
                          )}
                          {isBelowMin && <p className='text-xs text-amber-400'>Duration below 28-day minimum</p>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
            {perNameDatePickerIndex !== null && (
              <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'>
                <DatePicker
                  onSelect={(timestamp) => {
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
                  }}
                  onClose={() => setPerNameDatePickerIndex(null)}
                  className='w-full max-w-sm'
                />
              </div>
            )}
            <div className='border-tertiary flex flex-col gap-2 rounded-md border p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col'>
                  <p className='text-lg font-medium'>Mint to address</p>
                  <p className='text-neutral text-sm'>Set a custom owner for the registration</p>
                </div>
                <button
                  type='button'
                  onClick={() => setShowCustomOwner(!showCustomOwner)}
                  className={cn(
                    'group relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
                    showCustomOwner ? 'bg-primary' : 'bg-tertiary'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-lg transition-all duration-200',
                      showCustomOwner ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
              {showCustomOwner && (
                <>
                  <input
                    type='text'
                    className='bg-background border-tertiary hover:bg-secondary focus:bg-secondary flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-left text-lg transition-colors hover:border-white/70 focus:border-white/70 focus:outline-none'
                    placeholder='ENS Name or Address'
                    value={customOwner || ''}
                    onChange={(e) => setCustomOwner(e.target.value)}
                    disabled={!showCustomOwner}
                  />
                  {isResolving ? (
                    <div className='flex items-center gap-2'>
                      <LoadingCell height='24px' width='24px' radius='50%' />
                      <LoadingCell height='14px' width='160px' radius='4px' />
                    </div>
                  ) : account?.address ? (
                    <div key={account.address} className='flex items-center gap-2'>
                      <Avatar
                        address={account.address}
                        src={account.ens?.avatar}
                        name={account.ens?.name}
                        style={{ width: '24px', height: '24px' }}
                      />
                      <p className='text-md text-neutral max-w-full truncate pt-0.5 font-medium'>
                        {isAddress(debouncedCustomOwner) ? account.ens?.name : account.address}
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              {calculationResults && (
                <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                  <div className='text-md space-y-2'>
                    {!isBulk && (
                      <div className='flex items-center justify-between'>
                        <p>Registration Duration:</p>
                        <p className='font-medium'>{calculationResults.durationYears.toFixed(2)} years</p>
                      </div>
                    )}
                    <div className='flex items-center justify-between'>
                      <p>Total Cost (ETH):</p>
                      <div className='flex flex-col items-end'>
                        <p className='font-medium'>{calculationResults.priceETH.toFixed(6)} ETH</p>
                        <p className='text-neutral text-xs'>(${calculationResults.priceUSD.toFixed(2)})</p>
                      </div>
                    </div>
                    {gasEstimate && gasPrice && (
                      <div className='flex justify-between'>
                        <span>Estimated Gas:</span>
                        <span className='font-medium'>
                          ~{(Number((gasEstimate * gasPrice) / BigInt(10 ** 12)) / 10 ** 6).toFixed(6)} ETH
                        </span>
                      </div>
                    )}
                    {isBulk && (
                      <div className='flex items-center justify-between'>
                        <p>Names:</p>
                        <p className='font-medium'>{availableEntries.length}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {calculationResults?.isBelowMinimum && (
                <div className='rounded-lg border border-amber-500/20 bg-amber-900/20 p-3'>
                  <p className='text-md text-amber-400'>
                    Minimum registration duration is 28 days. Please select a longer duration.
                  </p>
                </div>
              )}
              <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                <p className='text-md text-neutral'>
                  {totalBatches > 1
                    ? `This registration requires ${totalBatches} commit + ${totalBatches} register transactions.`
                    : 'Note: You will have to make 2 transactions to complete your registration.'}
                </p>
              </div>
              {calculationResults && !hasSufficientBalance && (
                <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                  <p className='text-md text-red-400'>
                    Insufficient ETH balance. You need approximately {(calculationResults.priceETH + 0.01).toFixed(4)}{' '}
                    ETH to complete this registration (including gas costs).
                  </p>
                </div>
              )}
              {!allNamesValid && (
                <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                  <p className='text-md text-red-400'>
                    {isBulk
                      ? 'Some names contain invalid characters and cannot be registered.'
                      : 'This name contains invalid characters and cannot be registered.'}
                  </p>
                </div>
              )}
            </div>
            <div className='flex flex-col gap-2'>
              <PrimaryButton
                onClick={handleCommit}
                disabled={
                  !calculationResults ||
                  !hasSufficientBalance ||
                  !allNamesValid ||
                  !allDurationsValid ||
                  (registrationMode === 'register_to' && customDuration === 0) ||
                  !allAvailabilityChecked ||
                  availableEntries.length === 0 ||
                  calculationResults?.isBelowMinimum
                }
                className='w-full'
              >
                {!allNamesValid
                  ? 'Invalid Name'
                  : !hasSufficientBalance
                    ? 'Insufficient ETH Balance'
                    : calculationResults?.isBelowMinimum
                      ? 'Duration Too Short (28 days minimum)'
                      : !allAvailabilityChecked
                        ? 'Checking Availability...'
                        : isBulk
                          ? `Register ${availableEntries.length} Names`
                          : `Register ${beautifyName(firstName!)}`}
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegistrationModal
