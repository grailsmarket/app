'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useGasPrice, usePublicClient } from 'wagmi'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectRegistration,
  openRegistrationModal,
  setRegistrationFlowState,
  setCommitmentData,
  setCommitTxHash,
  setRegisterTxHash,
  setRegistrationError,
  setSecret,
  setRegistrationMode,
  setQuantity,
  setTimeUnit,
  setCustomDuration,
  setCalculatedDuration,
  setNameAvailable,
  TimeUnit,
  resetRegistrationModal,
} from '@/state/reducers/registration'
import useRegisterDomain from '@/hooks/registrar/useRegisterDomain'
import useETHPrice from '@/hooks/useETHPrice'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Input from '@/components/ui/input'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import DatePicker from '@/components/ui/datepicker'
import NameImage from '@/components/ui/nameImage'
import { DAY_IN_SECONDS, YEAR_IN_SECONDS } from '@/constants/time'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { ENS_HOLIDAY_REFERRER_ADDRESS, ENS_PUBLIC_RESOLVER_ADDRESS } from '@/constants/web3/contracts'
import { cn } from '@/utils/tailwind'
import { beautifyName } from '@/lib/ens'
import { useQueryClient } from '@tanstack/react-query'
import { Hex } from 'viem'
import { useIsClient } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import Link from 'next/link'
import ClaimPoap from '../poap/claimPoap'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'

const MIN_REGISTRATION_DURATION = 28 * DAY_IN_SECONDS // 28 days minimum

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
    makeCommitment,
    checkAvailable,
    getRentPrice,
    calculateDomainPriceUSD,
    submitCommit,
    checkCommitmentAge,
    getCommitmentAges,
    submitRegister,
  } = useRegisterDomain()

  // UI-only states (not persisted)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCancelWarning, setShowCancelWarning] = useState(false)
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number>(60)

  // Get persisted state from Redux
  const { registrationMode, quantity, timeUnit, customDuration, isNameAvailable } = registrationState
  const secret = registrationState.secret

  const { data: ethBalance } = useBalance({
    address,
  })

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

  useEffect(() => {
    if (!isClient) return

    const checkNameAvailability = async () => {
      // do not check availability if the modal is in a success (was just registered) or registering state (we know it's reserved)
      if (registrationState.flowState === 'success') return

      if (registrationState.name && registrationState.isOpen) {
        const nameLabel = registrationState.name.replace('.eth', '')
        const available = await checkAvailable(nameLabel)
        dispatch(setNameAvailable(available))
      }
    }

    checkNameAvailability()

    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to check availability when the modal is open and the name is changed, while the flow state is just a precaution to prevent accidental state changes and re-checking availability
  }, [registrationState.name, registrationState.isOpen, checkAvailable, isClient])

  // Handle wait timer and auto-advance when ready
  useEffect(() => {
    if (registrationState.flowState === 'waiting' && registrationState.commitmentTimestamp) {
      const interval = setInterval(async () => {
        const ages = await getCommitmentAges()
        const currentTime = Math.floor(Date.now() / 1000)
        const timePassed = currentTime - (registrationState.commitmentTimestamp || 0)
        const timeRemaining = Math.max(0, ages.min - timePassed)

        setWaitTimeRemaining(timeRemaining)

        if (timeRemaining === 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [registrationState.flowState, registrationState.commitmentTimestamp, getCommitmentAges])

  // Auto-open modal if we have an in-progress registration after page refresh
  useEffect(() => {
    if (
      !registrationState.isOpen &&
      registrationState.name &&
      registrationState.domain &&
      registrationState.flowState !== 'review' &&
      registrationState.flowState !== 'success' &&
      registrationState.flowState !== 'error'
    ) {
      console.log('Restoring in-progress registration for:', registrationState.name)
      dispatch(openRegistrationModal({ name: registrationState.name, domain: registrationState.domain }))
    }
  }, [registrationState, dispatch])

  const handleClose = () => {
    if (
      registrationState.flowState === 'committing' ||
      registrationState.flowState === 'registering' ||
      registrationState.flowState === 'waiting'
    )
      return

    dispatch(resetRegistrationModal())
  }

  const calculationResults = useMemo(() => {
    if (!registrationState.name) return null

    let durationSeconds: number

    if (registrationMode === 'register_for') {
      durationSeconds = quantity * getSecondsPerUnit(timeUnit)
    } else {
      if (!customDuration || customDuration === 0) return null
      durationSeconds = customDuration

      if (durationSeconds <= 0) {
        console.error('Selected date is in the past')
        return null
      }
    }

    const durationBigInt = BigInt(durationSeconds)
    const durationYears = durationSeconds / YEAR_IN_SECONDS
    const priceUSD = calculateDomainPriceUSD(registrationState.name, durationYears)
    const priceETH = ethPrice ? priceUSD / ethPrice : 0

    return {
      durationSeconds: durationBigInt,
      durationYears,
      priceUSD,
      priceETH,
      isBelowMinimum: durationSeconds < MIN_REGISTRATION_DURATION,
    }
  }, [registrationState.name, registrationMode, quantity, timeUnit, customDuration, ethPrice, calculateDomainPriceUSD])

  // Store calculated duration in Redux for persistence
  useEffect(() => {
    if (calculationResults) {
      dispatch(setCalculatedDuration(calculationResults.durationSeconds.toString()))
    }
  }, [calculationResults, dispatch])

  const gasEstimate = useMemo(() => {
    return BigInt(300000)
  }, [])

  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || !calculationResults || !gasPrice) return false

    const totalPriceWei = BigInt(Math.floor(calculationResults.priceETH * Math.pow(10, TOKEN_DECIMALS.ETH)))
    const gasWei = gasEstimate * gasPrice
    const totalRequired = totalPriceWei + gasWei

    return ethBalance.value >= totalRequired
  }, [ethBalance, calculationResults, gasPrice, gasEstimate])

  // Check if we already have a valid commitment for current parameters
  const checkExistingCommitment = async (): Promise<{ isValid: boolean; hash?: Hex; timestamp?: number }> => {
    if (!address || !registrationState.name || !calculationResults || !secret) {
      return { isValid: false }
    }

    try {
      const nameLabel = registrationState.name.replace('.eth', '')

      // Generate commitment hash with current parameters
      const expectedCommitment = await makeCommitment({
        label: nameLabel,
        owner: address,
        duration: calculationResults.durationSeconds,
        secret: secret,
        resolver: ENS_PUBLIC_RESOLVER_ADDRESS,
        data: [],
        reverseRecord: false,
        referrer: ENS_HOLIDAY_REFERRER_ADDRESS,
      })

      // Check if this commitment exists and is still valid
      const commitmentTimestamp = await checkCommitmentAge(expectedCommitment)

      if (commitmentTimestamp && commitmentTimestamp > 0) {
        const ages = await getCommitmentAges()
        const currentTime = Math.floor(Date.now() / 1000)
        const age = currentTime - commitmentTimestamp

        // Check if commitment is within valid age range
        if (age >= ages.min && age <= ages.max) {
          console.log('Found valid existing commitment:', {
            hash: expectedCommitment,
            age,
            minAge: ages.min,
            maxAge: ages.max,
          })
          return {
            isValid: true,
            hash: expectedCommitment,
            timestamp: commitmentTimestamp,
          }
        }
      }

      return { isValid: false }
    } catch (error) {
      console.error('Error checking existing commitment:', error)
      return { isValid: false }
    }
  }

  const refetchQueries = () => {
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'activity', address] })
      queryClient.refetchQueries({ queryKey: ['name', 'details', registrationState.name] })
      queryClient.refetchQueries({ queryKey: ['name', 'activity', registrationState.name] })
    }, 2000)
  }

  const checkForExistingCommitment = async () => {
    console.log('checkForExistingCommitment', registrationState)
    // Only check if we have all required data
    if (!registrationState.name || !registrationState.domain || !address || !secret || !calculationResults) {
      return
    }

    if (registrationState.registerTxHash) {
      dispatch(setRegistrationFlowState('registering'))
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: registrationState.registerTxHash,
        confirmations: 1,
      })

      console.log('receipt', receipt)

      if (receipt?.status !== 'reverted') {
        if (receipt?.status !== 'success') {
          throw new Error('Registration transaction failed')
        }

        dispatch(setRegistrationFlowState('success'))
        refetchQueries()

        const cartDomain =
          cartRegisteredDomains.find((cartDomain) => cartDomain.token_id === registrationState.domain?.token_id) ||
          cartUnregisteredDomains.find((cartDomain) => cartDomain.token_id === registrationState.domain?.token_id)
        if (cartDomain) {
          modifyCart({ domain: cartDomain, inCart: true, cartType: cartDomain.cartType })
        }
        return
      }
    }

    const timeSinceCommit = registrationState.commitmentTimestamp
      ? Math.floor(Date.now() / 1000) - registrationState.commitmentTimestamp
      : 0
    if (timeSinceCommit > 0 && timeSinceCommit < 60) {
      dispatch(setRegistrationFlowState('waiting'))
      return
    }

    const existingCommitment = await checkExistingCommitment()
    console.log('existingCommitment', existingCommitment)

    if (!existingCommitment.isValid && registrationState.commitTxHash && registrationState.commitmentHash) {
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: registrationState.commitTxHash,
        confirmations: 1,
      })

      if (receipt?.status === 'reverted') {
        dispatch(setRegistrationFlowState('error'))
        dispatch(setRegistrationError('Commitment transaction failed'))
        throw new Error('Commitment transaction failed')
      }

      if (receipt?.status !== 'success') {
        throw new Error('Commitment transaction failed')
      }

      const timestamp = Math.floor(Date.now() / 1000)
      dispatch(setCommitmentData({ hash: registrationState.commitmentHash, timestamp }))
      dispatch(setRegistrationFlowState('waiting'))
      return
    }

    if (existingCommitment.hash && existingCommitment.timestamp) {
      console.log('Auto-detected existing valid commitment, moving to waiting state')
      dispatch(
        setCommitmentData({
          hash: existingCommitment.hash,
          timestamp: existingCommitment.timestamp,
        })
      )
      dispatch(setRegistrationFlowState('waiting'))
      return
    }

    dispatch(setRegistrationFlowState('review'))
  }

  // Check for existing valid commitment when reloaded or when critical parameters change (address, name)
  useEffect(() => {
    checkForExistingCommitment()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to check when relevant registration parameters change
  }, [address, registrationState.name])

  const handleCommit = async () => {
    if (!address || !registrationState.name || !calculationResults) return

    // First check if we already have a valid commitment
    const existingCommitment = await checkExistingCommitment()

    if (existingCommitment.isValid && existingCommitment.hash && existingCommitment.timestamp) {
      console.log('Using existing valid commitment instead of creating new one')
      dispatch(
        setCommitmentData({
          hash: existingCommitment.hash,
          timestamp: existingCommitment.timestamp,
        })
      )
      dispatch(setRegistrationFlowState('waiting'))
      return
    }

    dispatch(setRegistrationFlowState('committing'))

    try {
      const commitSecret = secret || generateSecret()
      if (!secret) dispatch(setSecret(commitSecret))

      const nameLabel = registrationState.name.replace('.eth', '')

      const commitment = await makeCommitment({
        label: nameLabel,
        owner: address,
        duration: calculationResults.durationSeconds,
        secret: commitSecret,
        resolver: ENS_PUBLIC_RESOLVER_ADDRESS,
        data: [],
        reverseRecord: false,
        referrer: ENS_HOLIDAY_REFERRER_ADDRESS,
      })

      const tx = await submitCommit(commitment)
      dispatch(setCommitTxHash(tx))
      dispatch(setCommitmentData({ hash: commitment, timestamp: 0 }))

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

      if (receipt?.status === 'reverted') {
        dispatch(setRegistrationFlowState('error'))
        dispatch(setRegistrationError('Commitment transaction failed'))
        throw new Error('Commitment transaction failed')
      }

      if (receipt?.status !== 'success') {
        throw new Error('Commitment transaction failed')
      }

      const timestamp = Math.floor(Date.now() / 1000)
      dispatch(setCommitmentData({ hash: commitment, timestamp }))
      dispatch(setRegistrationFlowState('waiting'))
    } catch (error: any) {
      console.error('Failed to commit:', error)
      dispatch(setRegistrationError(error.message || 'Failed to submit commitment'))
    }
  }

  // Handle register phase
  const handleRegister = async () => {
    // Use persisted duration if calculation results are not available (e.g., after page refresh)
    const duration =
      calculationResults?.durationSeconds ||
      (registrationState.calculatedDuration ? BigInt(registrationState.calculatedDuration) : null)

    if (
      !address ||
      !registrationState.name ||
      !duration ||
      !secret ||
      !registrationState.commitmentHash ||
      !registrationState.domain
    )
      return

    dispatch(setRegistrationFlowState('registering'))

    try {
      const nameLabel = registrationState.name.replace('.eth', '')
      const rentPrice = await getRentPrice(nameLabel, duration)

      if (!rentPrice) {
        throw new Error('Failed to get registration price')
      }

      const tx = await submitRegister(
        {
          label: nameLabel,
          owner: address,
          duration: duration,
          secret,
          resolver: ENS_PUBLIC_RESOLVER_ADDRESS,
          data: [],
          reverseRecord: false,
          referrer: ENS_HOLIDAY_REFERRER_ADDRESS,
        },
        rentPrice.total
      )

      dispatch(setRegisterTxHash(tx))
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

      if (receipt?.status === 'reverted') {
        dispatch(setRegistrationFlowState('error'))
        dispatch(setRegistrationError('Registration transaction failed'))
        throw new Error('Registration transaction failed')
      }

      if (receipt?.status !== 'success') {
        throw new Error('Registration transaction failed')
      }

      dispatch(setRegistrationFlowState('success'))
      modifyCart({ domain: registrationState.domain, inCart: true, cartType: 'registrations' })
      refetchQueries()
    } catch (error: any) {
      console.error('Failed to register:', error)
      dispatch(setRegistrationError(error.message || 'Failed to register name'))
    }
  }

  if (!registrationState.isOpen || !registrationState.name || !registrationState.domain || !isClient) return null

  if (isNameAvailable === false) {
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
            <h2 className='font-sedan-sc text-center text-3xl'>Name Not Available</h2>
          </div>
          <div className='flex flex-col items-center gap-4 py-8'>
            <p className='text-center text-lg'>
              The name <span className='font-bold'>{beautifyName(registrationState.name)}</span> is not available for
              registration.
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

  if (registrationState.flowState === 'success' && !poapClaimed) {
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
          showDatePicker && 'min-h-[480px]'
        )}
      >
        <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
          <h2 className='font-sedan-sc text-center text-3xl'>Register Name</h2>
        </div>

        {registrationState.flowState === 'review' && (
          <div className='flex items-center justify-between gap-2'>
            <p className='font-sedan-sc text-center text-2xl'>Name</p>
            <p className='text-center text-xl font-bold'>{beautifyName(registrationState.name)}</p>
          </div>
        )}

        {registrationState.flowState === 'success' ? (
          <div className='flex flex-col items-center gap-4'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <h3 className='text-2xl font-bold'>Registration Successful!</h3>
              <Link
                href={`/${registrationState.name}`}
                className='py-1 transition-opacity hover:opacity-70'
                onClick={handleClose}
              >
                <NameImage
                  name={registrationState.name}
                  tokenId={registrationState.domain?.token_id}
                  expiryDate={new Date(Number(calculationResults?.durationSeconds) * 1000 + Date.now()).toISOString()}
                  className='h-48 w-48 rounded-lg'
                  height={192}
                  width={192}
                />
              </Link>
              {registrationState.registerTxHash && (
                <a
                  href={`https://etherscan.io/tx/${registrationState.registerTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View Transaction on Etherscan
                </a>
              )}
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
                checkForExistingCommitment()
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
            <h2 className='mt-4 text-center text-xl font-bold'>Submitting Commitment</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              {registrationState.commitTxHash ? (
                <a
                  href={`https://etherscan.io/tx/${registrationState.commitTxHash}`}
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
                      <span className='text-4xl font-bold'>{waitTimeRemaining}s</span>
                    </div>
                  </div>
                  <p className='text-center text-lg'>This prevents others from front-running your registration.</p>
                  {registrationState.commitTxHash && (
                    <a
                      href={`https://etherscan.io/tx/${registrationState.commitTxHash}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:text-primary/80 text-md underline transition-colors'
                    >
                      Commitment Transaction
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className='flex flex-col items-center justify-center gap-4 pb-4'>
                <p className='font-medium'>
                  <span className='font-bold'>{beautifyName(registrationState.name)}</span> is ready for registration.
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
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              {registrationState.registerTxHash ? (
                <a
                  href={`https://etherscan.io/tx/${registrationState.registerTxHash}`}
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
          <div className='flex w-full flex-col gap-2 sm:gap-4'>
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
            <div className='flex flex-col gap-2'>
              {calculationResults && (
                <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                  <div className='text-md space-y-2'>
                    <div className='flex items-center justify-between'>
                      <p>Registration Duration:</p>
                      <p className='font-medium'>{calculationResults.durationYears.toFixed(2)} years</p>
                    </div>
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
                  </div>
                </div>
              )}
              {calculationResults && calculationResults.isBelowMinimum && (
                <div className='rounded-lg border border-amber-500/20 bg-amber-900/20 p-3'>
                  <p className='text-md text-amber-400'>
                    ⚠️ Minimum registration duration is 28 days. Please select a longer duration.
                  </p>
                </div>
              )}
              <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                <p className='text-md text-neutral'>
                  Note: You will have to make 2 transactions to complete your registration.
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
            </div>
            <div className='flex flex-col gap-2'>
              <PrimaryButton
                onClick={handleCommit}
                disabled={
                  !calculationResults ||
                  !hasSufficientBalance ||
                  (registrationMode === 'register_to' && customDuration === 0) ||
                  isNameAvailable === null ||
                  calculationResults?.isBelowMinimum
                }
                className='w-full'
              >
                {!hasSufficientBalance
                  ? 'Insufficient ETH Balance'
                  : calculationResults?.isBelowMinimum
                    ? 'Duration Too Short (28 days minimum)'
                    : isNameAvailable === null
                      ? 'Checking Availability...'
                      : `Register ${beautifyName(registrationState.name)}`}
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
