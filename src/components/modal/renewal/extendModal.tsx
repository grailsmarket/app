'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAccount, useBalance, useGasPrice, usePublicClient } from 'wagmi'
import { Check } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkRenewalModal,
  setBulkRenewalModalCanAddDomains,
  setBulkRenewalModalDomains,
} from '@/state/reducers/modals/bulkRenewalModal'
import { clearBulkSelect, selectBulkSelect, removeBulkSelectDomain } from '@/state/reducers/modals/bulkSelectModal'
import useExtendDomains from '@/hooks/registrar/useExtendDomains'
import useETHPrice from '@/hooks/useETHPrice'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Input from '@/components/ui/input'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import DatePicker from '@/components/ui/datepicker'
import { DAY_IN_SECONDS } from '@/constants/time'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { useQueryClient } from '@tanstack/react-query'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ClaimPoap from '../poap/claimPoap'
import { ENS_HOLIDAY_BULK_RENEWAL_ADDRESS } from '@/constants/web3/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { cn } from '@/utils/tailwind'
import { ENS_HOLIDAY_RENEWAL_ABI } from '@/constants/abi/ENSHolidayRenewal'
import Image from 'next/image'
import Calendar from 'public/icons/calendar.svg'
import { CAN_CLAIM_POAP } from '@/constants'
import { beautifyName } from '@/lib/ens'
import { mainnet } from 'viem/chains'

interface ExtendModalProps {
  onClose: () => void
}

type ExtensionMode = 'extend_for' | 'extend_to'
type TimeUnit = 'days' | 'weeks' | 'months' | 'years' | 'custom'

const ExtendModal: React.FC<ExtendModalProps> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const { domains } = useAppSelector(selectBulkRenewalModal)
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { address } = useAccount()
  const { extend } = useExtendDomains()
  const { ethPrice } = useETHPrice()
  const { data: gasPrice } = useGasPrice()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()
  const { poapClaimed } = useAppSelector(selectUserProfile)

  // Component state
  const [extensionMode, setExtensionMode] = useState<ExtensionMode>('extend_for')
  const [quantity, setQuantity] = useState<number>(1)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('years')
  const [customDate, setCustomDate] = useState<number>(0)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Batch processing state
  const BATCH_SIZE = 100
  const [currentBatch, setCurrentBatch] = useState(1)
  const [totalBatches, setTotalBatches] = useState(1)
  const [namesProcessed, setNamesProcessed] = useState(0)
  const [completedTxHashes, setCompletedTxHashes] = useState<string[]>([])
  const [remainingDomains, setRemainingDomains] = useState(domains)

  // Sync remainingDomains with domains when modal opens or domains change
  useEffect(() => {
    setRemainingDomains(domains)
    setTotalBatches(Math.ceil(domains.length / BATCH_SIZE))
  }, [domains])

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
    chainId: mainnet.id,
  })

  // Time unit options
  const timeUnitOptions: DropdownOption[] = [
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
    { value: 'custom', label: 'Custom' },
  ]

  // Calculate seconds per unit
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

  const handleClose = () => {
    if (isLoading) return

    // Clear bulk selection only on success
    if (success) {
      dispatch(setBulkRenewalModalCanAddDomains(false))
      if (isSelecting) {
        dispatch(clearBulkSelect())
      }
    }

    // Always clear modal data when closing to prevent stale data
    dispatch(setBulkRenewalModalDomains([]))

    onClose()
  }

  // Find the longest expiration date among domains
  const longestExpirationDate = useMemo(() => {
    if (domains.length === 0) return 0
    return Math.max(
      ...domains.map((domain) => {
        if (!domain.expiry_date) return 0
        return Math.floor(new Date(domain.expiry_date).getTime() / 1000)
      })
    )
  }, [domains])

  const [calculationResults, setCalculationResults] = useState<{
    totalPriceUSD: number
    totalPriceETH: number
    extensionDetails: { domain: string; currentExpiry: number; duration: number }[]
  } | null>(null)

  useEffect(() => {
    const calculate = async () => {
      if (domains.length === 0 || !publicClient) return null

      const extensionDetails = []

      for (const domain of domains) {
        let duration = 0

        if (extensionMode === 'extend_for') {
          const secondsToAdd = quantity * getSecondsPerUnit(timeUnit)
          duration = secondsToAdd
        } else {
          if (customDate === 0) return null
          const currentExpiry = Math.floor(new Date(domain.expiry_date || 0).getTime() / 1000)
          const duration = Math.max(0, customDate - currentExpiry)

          extensionDetails.push({
            domain: domain.name,
            currentExpiry,
            duration,
          })

          continue
        }

        extensionDetails.push({
          domain: domain.name,
          currentExpiry: domain.expiry_date ? Math.floor(new Date(domain.expiry_date).getTime() / 1000) : 0,
          duration,
        })
      }

      const names = domains.map((item) => item.name.replace('.eth', ''))
      const durations = extensionDetails.map((detail) => BigInt(detail.duration))

      const rentPrice = (await publicClient?.readContract({
        address: ENS_HOLIDAY_BULK_RENEWAL_ADDRESS,
        abi: ENS_HOLIDAY_RENEWAL_ABI,
        functionName: 'bulkRentPrice',
        args: [names, durations],
      })) as bigint

      if (!rentPrice) return null

      const totalPriceETH =
        BigNumber.from(rentPrice)
          .div(BigNumber.from(10).pow(TOKEN_DECIMALS.ETH - 8))
          .toNumber() /
        10 ** 8
      const totalPriceUSD = totalPriceETH * (ethPrice || 0)

      setCalculationResults({
        totalPriceUSD,
        totalPriceETH,
        extensionDetails,
      })
    }

    calculate()
  }, [domains, extensionMode, quantity, timeUnit, customDate, longestExpirationDate, ethPrice, publicClient])

  // Calculate gas estimate (rough estimate for bulk renewal)
  const gasEstimate = useMemo(() => {
    if (!domains.length) return BigInt(0)
    // Estimate ~50k gas per domain + base transaction costs
    return BigInt(150000 + domains.length * 50000)
  }, [domains.length])

  // Check if user has sufficient ETH balance
  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || !calculationResults || !gasPrice) return false

    const totalPriceWei = BigInt(Math.floor(calculationResults.totalPriceETH * Math.pow(10, TOKEN_DECIMALS.ETH)))
    const gasWei = gasEstimate * gasPrice
    const totalRequired = totalPriceWei + gasWei

    return ethBalance.value >= totalRequired
  }, [ethBalance, calculationResults, gasPrice, gasEstimate])

  // Helper function to split array into chunks
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  // Helper function to refetch queries for domains
  const refetchDomainQueries = (domainsToRefetch: typeof domains) => {
    queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
    queryClient.refetchQueries({ queryKey: ['profile', 'domains'] })
    domainsToRefetch.forEach((domain) => {
      queryClient.refetchQueries({ queryKey: ['name', 'details', domain.name] })
    })
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Reset batch state
    setCurrentBatch(1)
    setNamesProcessed(0)
    setCompletedTxHashes([])

    if (!calculationResults) {
      setError('Invalid calculation parameters')
      setIsLoading(false)
      return
    }

    if (extensionMode === 'extend_to' && customDate <= longestExpirationDate) {
      setError('Extension date must be after the longest expiration date')
      setIsLoading(false)
      return
    }

    // Use remainingDomains for retry support
    const domainsToProcess = remainingDomains
    const batches = chunkArray(domainsToProcess, BATCH_SIZE)
    const numBatches = batches.length
    setTotalBatches(numBatches)

    const successfullyExtendedDomains: typeof domains = []
    const txHashes: string[] = []

    try {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        setCurrentBatch(batchIndex + 1)

        let durations: bigint[]

        if (extensionMode === 'extend_for') {
          durations = new Array(batch.length).fill(BigInt(quantity * getSecondsPerUnit(timeUnit)))
        } else {
          durations = batch.map((domain) =>
            BigInt(
              Math.max(
                0,
                customDate - (domain.expiry_date ? Math.floor(new Date(domain.expiry_date).getTime() / 1000) : 0)
              )
            )
          )
        }

        const names = batch.map((item) => item.name.replace('.eth', ''))

        const rentPrice = (await publicClient?.readContract({
          address: ENS_HOLIDAY_BULK_RENEWAL_ADDRESS,
          abi: ENS_HOLIDAY_RENEWAL_ABI,
          functionName: 'bulkRentPrice',
          args: [names, durations],
        })) as bigint

        const tx = await extend(names, durations, rentPrice)

        if (!tx) {
          throw new Error(`Transaction ${batchIndex + 1} failed`)
        }

        setTxHash(tx)
        const receipt = await publicClient?.waitForTransactionReceipt({
          hash: tx,
          confirmations: 1,
        })

        if (receipt?.status !== 'success') {
          throw new Error(`Transaction ${batchIndex + 1} failed`)
        }

        // Batch succeeded
        txHashes.push(tx)
        setCompletedTxHashes([...txHashes])
        successfullyExtendedDomains.push(...batch)
        setNamesProcessed(successfullyExtendedDomains.length)

        // Update remaining domains (for retry support)
        const remaining = domainsToProcess.slice((batchIndex + 1) * BATCH_SIZE)
        setRemainingDomains(remaining)
      }

      // All batches completed successfully
      setSuccess(true)
      setTimeout(() => {
        refetchDomainQueries(domainsToProcess)
      }, 2500)
    } catch (err: any) {
      console.error('Failed to extend domains:', err)
      setError(err.message || 'Transaction failed')

      // Refetch queries for successfully extended domains
      if (successfullyExtendedDomains.length > 0) {
        setTimeout(() => {
          refetchDomainQueries(successfullyExtendedDomains)
        }, 2500)
      }

      // Remove successfully extended domains from bulk selection
      successfullyExtendedDomains.forEach((domain) => {
        dispatch(removeBulkSelectDomain(domain))
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (domains.length === 0) return null

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (success || isLoading) return
        onClose()
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className={cn(
          'border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2',
          showDatePicker && 'min-h-[480px]'
        )}
      >
        {success && CAN_CLAIM_POAP && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <div className='z-10 flex min-h-6 items-center justify-center pb-2'>
              <h2 className='font-sedan-sc text-center text-3xl'>Extend Name{domains.length > 1 ? 's' : ''}</h2>
            </div>

            {success ? (
              <div className='flex flex-col items-center gap-4 py-2'>
                <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-3'>
                  <Check className='text-background h-8 w-8' />
                </div>
                <div className='flex flex-col items-center gap-2 text-center'>
                  <h3 className='mb-2 text-xl font-bold'>Extended Names Successfully!</h3>
                  {completedTxHashes.length > 0 ? (
                    <div className='flex flex-col gap-1'>
                      {completedTxHashes.length > 1 && (
                        <p className='text-neutral mb-1 text-sm'>{completedTxHashes.length} transactions completed</p>
                      )}
                      {completedTxHashes.map((hash, index) => (
                        <a
                          key={hash}
                          href={`https://etherscan.io/tx/${hash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                        >
                          {completedTxHashes.length > 1
                            ? `View Transaction ${index + 1} on Etherscan`
                            : 'View on Etherscan'}
                        </a>
                      ))}
                    </div>
                  ) : txHash ? (
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                    >
                      View on Etherscan
                    </a>
                  ) : null}
                </div>
              </div>
            ) : isLoading ? (
              <div className='flex w-full flex-col gap-4'>
                <h2 className='mt-4 text-center text-xl font-bold'>
                  Processing Transaction{totalBatches > 1 ? ` ${currentBatch} of ${totalBatches}` : ''}
                </h2>
                <div className='flex flex-col items-center justify-center gap-4 pt-4 pb-4 text-center'>
                  <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
                  <div className='flex flex-col gap-1'>
                    <p className='text-neutral text-lg'>
                      Extending {namesProcessed}/{domains.length} names...
                    </p>
                    {totalBatches > 1 && (
                      <p className='text-neutral text-sm'>
                        Batch {currentBatch} of {totalBatches}
                      </p>
                    )}
                  </div>
                  {txHash && (
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                    >
                      View Transaction {currentBatch} on Etherscan
                    </a>
                  )}
                  {completedTxHashes.length > 0 && (
                    <div className='flex flex-col gap-1'>
                      <p className='text-neutral text-sm'>Completed transactions:</p>
                      {completedTxHashes.map((hash, index) => (
                        <a
                          key={hash}
                          href={`https://etherscan.io/tx/${hash}`}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary/70 hover:text-primary text-sm underline transition-colors'
                        >
                          Transaction {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='flex w-full flex-col gap-2 sm:gap-2'>
                {/* Domain list */}
                <div>
                  <div className='bg-secondary border-tertiary max-h-[160px] overflow-y-auto rounded-lg border p-3'>
                    <div className='text-md space-y-1'>
                      <div className='text-neutral flex w-full flex-row items-center justify-between gap-1 text-xs sm:text-sm'>
                        <p className='w-[40%] sm:w-1/2'>Name</p>
                        <div className='flex w-[60%] flex-row items-center justify-between sm:w-1/2'>
                          <p className='w-1/2 text-right'>Old Expiration</p>
                          <p className='w-1/2 text-right'>New Expiration</p>
                        </div>
                      </div>
                      {domains.map((domain, index) => (
                        <div key={index} className='flex justify-between'>
                          <span className='w-[40%] truncate font-semibold sm:w-1/2 sm:max-w-1/2'>{domain.name}</span>
                          <div className='flex w-[60%] flex-row items-center justify-between sm:w-1/2'>
                            <p className='text-neutral w-1/2 text-right font-medium'>
                              {domain.expiry_date ? new Date(domain.expiry_date).toLocaleDateString() : 'Unknown'}
                            </p>
                            <div className='flex w-1/2 flex-row items-center justify-end'>
                              <p className='text-neutral text-md mx-auto pb-px text-center'>&rarr;</p>
                              <p className='text-right font-medium text-green-500'>
                                {domain.expiry_date
                                  ? new Date(
                                      extensionMode === 'extend_for'
                                        ? new Date(domain.expiry_date).getTime() +
                                          quantity * getSecondsPerUnit(timeUnit) * 1000
                                        : customDate * 1000
                                    ).toLocaleDateString()
                                  : 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className='flex flex-col gap-2'>
                  <div className='flex w-full flex-row gap-2'>
                    <Dropdown
                      label='Unit'
                      hideLabel={true}
                      options={timeUnitOptions}
                      value={timeUnit}
                      onSelect={(value) => {
                        setTimeUnit(value as TimeUnit)
                        if (value === 'custom') {
                          setShowDatePicker(true)
                          setExtensionMode('extend_to')
                        } else {
                          setShowDatePicker(false)
                          setExtensionMode('extend_for')
                        }
                      }}
                      className='w-2/5'
                    />
                    {timeUnit === 'custom' ? (
                      <PrimaryButton
                        onClick={() => setShowDatePicker(true)}
                        className='h-12! w-full'
                        disabled={isLoading}
                      >
                        {customDate
                          ? new Date(customDate * 1000).toLocaleDateString(navigator.language || 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Select Date'}
                      </PrimaryButton>
                    ) : (
                      <Input
                        type='number'
                        label='Quantity'
                        placeholder='Number'
                        min={0}
                        hideLabel={true}
                        className='w-3/5'
                        value={quantity || ''}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                      />
                    )}
                    {showDatePicker && (
                      <div className='absolute top-0 left-0 z-10 flex h-full w-full items-center justify-center bg-black/40 p-6 backdrop-blur-sm'>
                        <DatePicker
                          onSelect={(timestamp) => {
                            setCustomDate(timestamp)
                            setShowDatePicker(false)
                          }}
                          onClose={() => setShowDatePicker(false)}
                          className='w-full max-w-sm'
                          minDate={new Date(longestExpirationDate * 1000)}
                        />
                      </div>
                    )}
                  </div>

                  <div className='border-tertiary bg-secondary rounded-lg border p-2'>
                    <p className='text-md text-neutral'>
                      When setting a custom date, you will only be able to select a date after the longest expiration
                      date of your domains.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setTimeUnit('custom')
                      setShowDatePicker(true)
                      setExtensionMode('extend_to')
                    }}
                    className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
                  >
                    <p>Select a custom date</p>
                    <Image src={Calendar} alt='calendar' width={18} height={18} />
                  </button>
                </div>

                <div className='flex flex-col gap-2'>
                  {/* Pricing display */}
                  {calculationResults && (
                    <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                      {/* <h3 className='mb-2 text-lg font-medium'>Cost Breakdown</h3> */}
                      <div className='text-md space-y-2'>
                        <div className='flex items-center justify-between'>
                          <p>Total Cost (ETH):</p>
                          <div className='flex flex-col items-end'>
                            <p className='font-medium'>{calculationResults.totalPriceETH.toFixed(6)} ETH</p>
                            <p className='text-neutral text-xs'>(${calculationResults.totalPriceUSD.toFixed(2)})</p>
                          </div>
                        </div>
                        {gasEstimate && gasPrice && (
                          <div className='flex justify-between'>
                            <span>Estimated Gas:</span>
                            <span className='font-medium'>
                              ~{(Number((gasEstimate * gasPrice) / BigInt(10 ** 12)) / 10 ** 6).toString()} ETH
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {error && (
                    <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                      <p className='text-sm text-red-400'>{error}</p>
                      {namesProcessed > 0 && (
                        <p className='mt-2 text-sm text-yellow-400'>
                          {namesProcessed} of {domains.length} names were successfully extended.
                          {remainingDomains.length > 0 && ` ${remainingDomains.length} names remaining.`}
                        </p>
                      )}
                      {completedTxHashes.length > 0 && (
                        <div className='mt-2 flex flex-col gap-1'>
                          <p className='text-neutral text-xs'>Completed transactions:</p>
                          {completedTxHashes.map((hash, index) => (
                            <a
                              key={hash}
                              href={`https://etherscan.io/tx/${hash}`}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary/70 hover:text-primary text-xs underline transition-colors'
                            >
                              Transaction {index + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Insufficient balance warning */}
                  {calculationResults && !hasSufficientBalance && (
                    <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                      <p className='text-md text-red-400'>
                        Insufficient ETH balance. You need approximately{' '}
                        {(calculationResults.totalPriceETH + 0.01).toFixed(4)} ETH to complete this renewal (including
                        gas costs).
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Action buttons */}
            <div className='flex flex-col gap-2'>
              {!success && (
                <PrimaryButton
                  onClick={handleSubmit}
                  disabled={
                    isLoading ||
                    !calculationResults ||
                    !hasSufficientBalance ||
                    (extensionMode === 'extend_to' && customDate === 0) ||
                    remainingDomains.length === 0
                  }
                  className='w-full'
                >
                  {isLoading
                    ? totalBatches > 1
                      ? `Extending... (${currentBatch}/${totalBatches})`
                      : 'Extending...'
                    : !hasSufficientBalance
                      ? 'Insufficient ETH Balance'
                      : error && remainingDomains.length > 0
                        ? `Try Again (${remainingDomains.length} name${remainingDomains.length > 1 ? 's' : ''} remaining)`
                        : remainingDomains.length === 1
                          ? `Extend ${beautifyName(remainingDomains[0].name)}`
                          : `Extend ${remainingDomains.length} Name${remainingDomains.length > 1 ? 's' : ''}`}
                </PrimaryButton>
              )}
              <SecondaryButton onClick={handleClose} className='w-full' disabled={isLoading}>
                Close
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ExtendModal
