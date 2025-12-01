'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useGasPrice, usePublicClient } from 'wagmi'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectRegistrationModal,
  closeRegistrationModal,
  setRegistrationFlowState,
  setCommitmentData,
  setCommitTxHash,
  setRegisterTxHash,
  setRegistrationError,
  setSecret,
} from '@/state/reducers/modals/registrationModal'
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

type RegistrationMode = 'register_for' | 'register_to'
type TimeUnit = 'days' | 'weeks' | 'months' | 'years'

const currentTime = Math.floor(Date.now() / 1000)

const RegistrationModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const modalState = useAppSelector(selectRegistrationModal)
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
    getCommitmentAges,
    submitRegister,
  } = useRegisterDomain()

  const [registrationMode, setRegistrationMode] = useState<RegistrationMode>('register_for')
  const [quantity, setQuantity] = useState<number>(1)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('years')
  const [customDate, setCustomDate] = useState<number>(0)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number>(60)
  const [isNameAvailable, setIsNameAvailable] = useState<boolean | null>(null)
  const secret = modalState.secret

  const { data: ethBalance } = useBalance({
    address,
  })

  const timeUnitOptions: DropdownOption[] = [
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
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
      default:
        return DAY_IN_SECONDS * 365
    }
  }

  useEffect(() => {
    const checkNameAvailability = async () => {
      // do not check availability if the modal is in a success (was just registered) or registering state (we know it's reserved)
      if (modalState.flowState === 'success' || modalState.flowState === 'registering') return

      if (modalState.name && modalState.isOpen) {
        const nameLabel = modalState.name.replace('.eth', '')
        const available = await checkAvailable(nameLabel)
        setIsNameAvailable(available)
      }
    }

    checkNameAvailability()

    // eslint-disable-next-line react-hooks/exhaustive-deps -- we only want to check availability when the modal is open and the name is changed, while the flow state is just a precaution to prevent accidental state changes and re-checking availability
  }, [modalState.name, modalState.isOpen, checkAvailable])

  useEffect(() => {
    if (modalState.flowState === 'waiting' && modalState.commitmentTimestamp) {
      const interval = setInterval(async () => {
        const ages = await getCommitmentAges()
        const currentTime = Math.floor(Date.now() / 1000)
        const timePassed = currentTime - (modalState.commitmentTimestamp || 0)
        const timeRemaining = Math.max(0, ages.min - timePassed)

        setWaitTimeRemaining(timeRemaining)

        if (timeRemaining === 0) {
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [modalState.flowState, modalState.commitmentTimestamp, getCommitmentAges])

  const handleClose = () => {
    if (
      modalState.flowState === 'committing' ||
      modalState.flowState === 'registering' ||
      modalState.flowState === 'waiting'
    )
      return
    dispatch(closeRegistrationModal())
  }

  const calculationResults = useMemo(() => {
    if (!modalState.name) return null

    let durationSeconds: number

    if (registrationMode === 'register_for') {
      durationSeconds = quantity * getSecondsPerUnit(timeUnit)
    } else {
      if (customDate === 0) return null
      durationSeconds = customDate - currentTime

      if (durationSeconds <= 0) {
        console.error('Selected date is in the past')
        return null
      }

      const maxDuration = 100 * YEAR_IN_SECONDS
      if (durationSeconds > maxDuration) {
        durationSeconds = maxDuration
      }
    }

    const durationYears = durationSeconds / YEAR_IN_SECONDS
    const priceUSD = calculateDomainPriceUSD(modalState.name, durationYears)
    const priceETH = ethPrice ? priceUSD / ethPrice : 0

    return {
      durationSeconds: BigInt(durationSeconds),
      durationYears,
      priceUSD,
      priceETH,
    }
  }, [modalState.name, registrationMode, quantity, timeUnit, customDate, ethPrice, calculateDomainPriceUSD])

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

  const handleCommit = async () => {
    if (!address || !modalState.name || !calculationResults) return

    dispatch(setRegistrationFlowState('committing'))

    try {
      const commitSecret = secret || generateSecret()
      if (!secret) dispatch(setSecret(commitSecret))

      const nameLabel = modalState.name.replace('.eth', '')

      console.log('Registration parameters:', {
        label: nameLabel,
        owner: address,
        duration: calculationResults.durationSeconds.toString(),
        durationYears: calculationResults.durationYears,
        registrationMode,
        customDate,
        secret: commitSecret,
        currentTime: Math.floor(Date.now() / 1000),
      })

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

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

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
    if (!address || !modalState.name || !calculationResults || !secret || !modalState.commitmentHash) return

    dispatch(setRegistrationFlowState('registering'))

    try {
      const nameLabel = modalState.name.replace('.eth', '')
      const rentPrice = await getRentPrice(nameLabel, calculationResults.durationSeconds)

      if (!rentPrice) {
        throw new Error('Failed to get registration price')
      }

      const tx = await submitRegister(
        {
          label: nameLabel,
          owner: address,
          duration: calculationResults.durationSeconds,
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

      if (receipt?.status !== 'success') {
        throw new Error('Registration transaction failed')
      }

      dispatch(setRegistrationFlowState('success'))

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['portfolio', 'domains'] })
        queryClient.invalidateQueries({ queryKey: ['profile', 'activity', address] })
        queryClient.refetchQueries({ queryKey: ['name', 'details', modalState.name] })
        queryClient.refetchQueries({ queryKey: ['name', 'activity', modalState.name] })
      }, 2000)
    } catch (error: any) {
      console.error('Failed to register:', error)
      dispatch(setRegistrationError(error.message || 'Failed to register name'))
    }
  }

  if (!modalState.isOpen || !modalState.name) return null

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
              The name <span className='font-bold'>{beautifyName(modalState.name)}</span> is not available for
              registration.
            </p>
          </div>
          <SecondaryButton onClick={handleClose} className='w-full'>
            Close
          </SecondaryButton>
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
          modalState.flowState === 'success' ||
          modalState.flowState === 'committing' ||
          modalState.flowState === 'registering'
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

        {modalState.flowState === 'review' && (
          <div className='flex items-center justify-between gap-2'>
            <p className='font-sedan-sc text-center text-2xl'>Name</p>
            <p className='text-center text-xl font-bold'>{beautifyName(modalState.name)}</p>
          </div>
        )}

        {modalState.flowState === 'success' ? (
          <div className='flex flex-col items-center gap-4'>
            <div className='flex flex-col items-center gap-4 text-center'>
              <h3 className='text-2xl font-bold'>Registration Successful!</h3>
              <div className='flex justify-center py-1'>
                <NameImage
                  name={modalState.name}
                  tokenId={modalState.name.replace('.eth', '')}
                  expiryDate={null}
                  className='h-48 w-48 rounded-lg'
                  height={192}
                  width={192}
                />
              </div>
              {modalState.registerTxHash && (
                <a
                  href={`https://etherscan.io/tx/${modalState.registerTxHash}`}
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
        ) : modalState.flowState === 'error' ? (
          <div className='flex flex-col gap-4'>
            <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <p className='text-sm text-red-400'>{modalState.errorMessage}</p>
            </div>
            <SecondaryButton onClick={() => dispatch(setRegistrationFlowState('review'))} className='w-full'>
              Try Again
            </SecondaryButton>
          </div>
        ) : modalState.flowState === 'committing' ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='mt-4 text-center text-xl font-bold'>Submitting Commitment</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              {modalState.commitTxHash ? (
                <a
                  href={`https://etherscan.io/tx/${modalState.commitTxHash}`}
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
          </div>
        ) : modalState.flowState === 'waiting' ? (
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
                  <p className='text-center text-lg'>
                    Please wait for the commitment to mature. This prevents others from front-running your registration.
                  </p>
                  {modalState.commitTxHash && (
                    <a
                      href={`https://etherscan.io/tx/${modalState.commitTxHash}`}
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
                  <span className='font-bold'>{beautifyName(modalState.name)}</span> is ready for registration.
                </p>
              </div>
            )}
            <PrimaryButton onClick={handleRegister} disabled={waitTimeRemaining > 0} className='w-full'>
              {waitTimeRemaining > 0 ? `Wait ${waitTimeRemaining} seconds...` : 'Complete Registration'}
            </PrimaryButton>
          </div>
        ) : modalState.flowState === 'registering' ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='mt-4 text-center text-xl font-bold'>Completing Registration</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              {modalState.registerTxHash ? (
                <a
                  href={`https://etherscan.io/tx/${modalState.registerTxHash}`}
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
          </div>
        ) : (
          <div className='flex w-full flex-col gap-2 sm:gap-4'>
            <div>
              <div className='p-sm border-primary flex w-full gap-1 rounded-md border'>
                <div
                  onClick={() => setRegistrationMode('register_for')}
                  className={cn(
                    'flex h-9 w-1/2 cursor-pointer items-center justify-center rounded-sm',
                    registrationMode === 'register_for'
                      ? 'bg-primary text-background'
                      : 'hover:bg-primary/10 bg-transparent'
                  )}
                >
                  <p className='text-xl font-semibold'>Register For</p>
                </div>
                <div
                  onClick={() => setRegistrationMode('register_to')}
                  className={cn(
                    'flex h-9 w-1/2 cursor-pointer items-center justify-center rounded-sm',
                    registrationMode === 'register_to'
                      ? 'bg-primary text-background'
                      : 'hover:bg-primary/10 bg-transparent'
                  )}
                >
                  <p className='text-xl font-semibold'>Register To</p>
                </div>
              </div>
            </div>
            {registrationMode === 'register_for' ? (
              <div className='flex w-full flex-row gap-2'>
                <Dropdown
                  label='Unit'
                  hideLabel={true}
                  options={timeUnitOptions}
                  value={timeUnit}
                  onSelect={(value) => setTimeUnit(value as TimeUnit)}
                  className='w-2/5'
                />
                <Input
                  type='number'
                  label='Quantity'
                  placeholder='Number'
                  min={1}
                  hideLabel={true}
                  className='w-3/5'
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            ) : (
              <div className='z-10'>
                <div className='mb-2'>
                  <label className='block text-lg font-medium'>Register To Date</label>
                  <p className='text-neutral text-sm'>Select the date when your registration will expire</p>
                </div>
                <PrimaryButton onClick={() => setShowDatePicker(true)} className='w-full'>
                  {customDate
                    ? new Date(customDate * 1000).toLocaleDateString(navigator.language || 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    : 'Select Date'}
                </PrimaryButton>
                {showDatePicker && (
                  <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-3 backdrop-blur-sm md:p-6'>
                    <DatePicker
                      onSelect={(timestamp) => {
                        setCustomDate(timestamp)
                        setShowDatePicker(false)
                      }}
                      onClose={() => setShowDatePicker(false)}
                      className='w-full max-w-sm'
                    />
                  </div>
                )}
              </div>
            )}
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
                  (registrationMode === 'register_to' && customDate === 0) ||
                  isNameAvailable === null
                }
                className='w-full'
              >
                {!hasSufficientBalance
                  ? 'Insufficient ETH Balance'
                  : isNameAvailable === null
                    ? 'Checking Availability...'
                    : `Register ${beautifyName(modalState.name)}`}
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
