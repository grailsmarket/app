'use client'

import { useMemo, useState } from 'react'
import { useAccount, useBalance, useGasPrice, usePublicClient } from 'wagmi'
import { Check } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkRenewalModal,
  setBulkRenewalModalCanAddDomains,
  setBulkRenewalModalDomains,
} from '@/state/reducers/modals/bulkRenewalModal'
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

interface ExtendModalProps {
  onClose: () => void
}

type ExtensionMode = 'extend_for' | 'extend_to'
type TimeUnit = 'days' | 'weeks' | 'months' | 'years'

const ExtendModal: React.FC<ExtendModalProps> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const { domains } = useAppSelector(selectBulkRenewalModal)
  const { address } = useAccount()
  const { extend } = useExtendDomains()
  const { ethPrice } = useETHPrice()
  const { data: gasPrice } = useGasPrice()
  const publicClient = usePublicClient()
  const queryClient = useQueryClient()

  // Component state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [extensionMode, setExtensionMode] = useState<ExtensionMode>('extend_for')
  const [quantity, setQuantity] = useState<number>(1)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('years')
  const [customDate, setCustomDate] = useState<number>(0)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  // Get ETH balance
  const { data: ethBalance } = useBalance({
    address,
  })

  // Time unit options
  const timeUnitOptions: DropdownOption[] = [
    { value: 'days', label: 'Days' },
    { value: 'weeks', label: 'Weeks' },
    { value: 'months', label: 'Months' },
    { value: 'years', label: 'Years' },
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
      default:
        return DAY_IN_SECONDS * 365
    }
  }

  const handleClose = () => {
    if (isLoading) return

    if (success) {
      dispatch(setBulkRenewalModalDomains([]))
      dispatch(setBulkRenewalModalCanAddDomains(false))
    }

    onClose()
  }

  // Get domain pricing based on length
  const getDomainPrice = (domain: string, years: number): number => {
    const nameLength = domain.replace('.eth', '').length
    const basePrice = nameLength === 3 ? 640 : nameLength === 4 ? 160 : 5
    return basePrice * years
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

  // Calculate total pricing and extension details
  const calculationResults = useMemo(() => {
    if (domains.length === 0) return null

    let totalPriceUSD = 0
    const extensionDetails = []

    for (const domain of domains) {
      let extensionYears = 0

      if (extensionMode === 'extend_for') {
        // Convert quantity and time unit to years
        const secondsToAdd = quantity * getSecondsPerUnit(timeUnit)
        extensionYears = secondsToAdd / (DAY_IN_SECONDS * 365)
      } else {
        // Calculate from longest expiry to custom date
        if (customDate === 0) return null
        const secondsToAdd = Math.max(0, customDate - longestExpirationDate)
        extensionYears = secondsToAdd / (DAY_IN_SECONDS * 365)
      }

      const domainPriceUSD = getDomainPrice(domain.name, extensionYears)
      totalPriceUSD += domainPriceUSD

      extensionDetails.push({
        domain: domain.name,
        currentExpiry: domain.expiry_date ? Math.floor(new Date(domain.expiry_date).getTime() / 1000) : 0,
        extensionYears,
        priceUSD: domainPriceUSD,
      })
    }

    // Convert USD to ETH
    const totalPriceETH = ethPrice ? totalPriceUSD / ethPrice : 0

    return {
      totalPriceUSD,
      totalPriceETH,
      extensionDetails,
    }
  }, [domains, extensionMode, quantity, timeUnit, customDate, longestExpirationDate, ethPrice])

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

  // Current balance formatted
  // const currentBalanceFormatted = useMemo(() => {
  //   if (!ethBalance) return '0'
  //   const balance = Number(ethBalance.value) / Math.pow(10, TOKEN_DECIMALS.ETH)
  //   return balance.toFixed(4)
  // }, [ethBalance])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

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

    try {
      let expireTime: number

      if (extensionMode === 'extend_for') {
        expireTime = quantity * getSecondsPerUnit(timeUnit)
      } else {
        expireTime = Math.max(0, customDate - longestExpirationDate)
      }

      const tx = await extend(domains, expireTime, calculationResults.totalPriceETH)

      if (!tx) {
        throw new Error('Transaction failed')
      }

      setTxHash(tx)
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

      if (receipt?.status !== 'success') {
        throw new Error('Transaction failed')
      }

      setSuccess(true)
      queryClient.refetchQueries({ queryKey: ['portfolio', 'domains'] })
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'domains'] })
    } catch (err: any) {
      console.error('Failed to extend domains:', err)
      setError(err.message || 'Transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (domains.length === 0) return null

  return (
    <div
      onClick={() => {
        if (success || isLoading) return

        onClose()
      }}
      className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center overflow-scroll bg-black/50 px-2 py-12 backdrop-blur-sm sm:px-4'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
        }}
        className='bg-background border-primary p-lg sm:p-xl relative flex h-fit w-full max-w-2xl flex-col gap-4 rounded-md border-2'
        style={{ margin: '0 auto', maxWidth: '32rem' }}
      >
        {/* Header with close button */}
        <div className='flex items-center justify-center'>
          <h2 className='font-sedan-sc text-center text-3xl'>Extend Names</h2>
          {/* <Cross
            onClick={onClose}
            className='h-4 w-4 cursor-pointer opacity-70 hover:opacity-100'
          /> */}
        </div>

        {success ? (
          // Success state
          <div className='flex flex-col items-center gap-4 py-8'>
            <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-3'>
              <Check className='text-background h-8 w-8' />
            </div>
            <div className='text-center'>
              <h3 className='mb-2 text-xl font-bold'>Extended Names Successfully!</h3>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='mt-4 text-center text-xl font-bold'>Processing Transaction</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Transaction submitted</p>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className='flex w-full flex-col gap-4'>
            {/* Domain list */}
            <div>
              <div className='bg-secondary border-tertiary max-h-32 overflow-y-auto rounded-lg border p-3'>
                <div className='text-md space-y-1'>
                  {domains.map((domain, index) => (
                    <div key={index} className='flex justify-between'>
                      <span className='font-semibold'>{domain.name}</span>
                      <span className='text-neutral font-medium'>
                        Current Expiry:{' '}
                        {domain.expiry_date ? new Date(domain.expiry_date).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Extension mode selection */}
            {/* <div>
              <div className='flex w-full gap-1 p-sm border border-primary rounded-md'>
                <div
                  onClick={() => setExtensionMode('extend_for')}
                  className={cn('w-1/2 h-9 flex items-center justify-center rounded-sm cursor-pointer', extensionMode === 'extend_for' ? 'bg-primary text-background' : 'bg-transparent hover:bg-primary/10')}
                >
                  <p className='font-semibold text-xl'>Extend For</p>
                </div>
                <div
                  onClick={() => setExtensionMode('extend_to')}
                  className={cn('w-1/2 h-9 flex items-center justify-center rounded-sm cursor-pointer', extensionMode === 'extend_to' ? 'bg-primary text-background' : 'bg-transparent hover:bg-primary/10')}
                >
                  <p className='font-semibold text-xl'>Extend To</p>
                </div>
              </div>
            </div> */}

            {/* Extension parameters */}
            {extensionMode === 'extend_for' ? (
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
                  hideLabel={true}
                  className='w-3/5'
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            ) : (
              <div className='relative'>
                <div className='mb-2'>
                  <label className='block text-lg font-medium'>Extend To Date</label>
                  <p className='text-neutral text-sm'>
                    Extensions will be calculated from the longest expiry date:{' '}
                    {longestExpirationDate ? new Date(longestExpirationDate * 1000).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <PrimaryButton
                  onClick={() => setShowDatePicker(true)}
                  className='w-full'
                  disabled={!customDate || isLoading || !hasSufficientBalance}
                >
                  {customDate ? new Date(customDate * 1000).toLocaleDateString() : 'Select Date'}
                </PrimaryButton>
                {showDatePicker && (
                  <DatePicker
                    onSelect={(timestamp) => {
                      setCustomDate(timestamp)
                      setShowDatePicker(false)
                    }}
                    onClose={() => setShowDatePicker(false)}
                    className='absolute top-20 left-0 z-10 w-full'
                  />
                )}
              </div>
            )}

            {/* Calculation results */}
            <div>
              <div className='bg-secondary border-tertiary max-h-32 overflow-y-auto rounded-lg border p-3'>
                <h3 className='mb-2 text-lg font-semibold'>Extended</h3>
                <div className='text-md space-y-1'>
                  {domains.map((domain, index) => (
                    <div key={index} className='flex justify-between'>
                      <span className='font-semibold'>{domain.name}</span>
                      <span className='font-medium text-green-500'>
                        New Expiry:{' '}
                        {domain.expiry_date
                          ? new Date(
                            new Date(domain.expiry_date).getTime() + quantity * getSecondsPerUnit(timeUnit) * 1000
                          ).toLocaleDateString()
                          : 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              {/* Pricing display */}
              {calculationResults && (
                <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                  <h3 className='mb-2 text-lg font-medium'>Cost Breakdown</h3>
                  <div className='text-md space-y-2'>
                    <div className='flex justify-between'>
                      <span>Total Cost (USD):</span>
                      <span className='font-medium'>${calculationResults.totalPriceUSD.toFixed(2)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Total Cost (ETH):</span>
                      <span className='font-medium'>{calculationResults.totalPriceETH.toFixed(6)} ETH</span>
                    </div>
                    {/* <div className='flex justify-between'>
                      <span>Your ETH Balance:</span>
                      <span className={`font-medium ${!hasSufficientBalance ? 'text-red-400' : ''}`}>
                        {currentBalanceFormatted} ETH
                      </span>
                    </div> */}
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
                </div>
              )}

              {/* Insufficient balance warning */}
              {calculationResults && !hasSufficientBalance && (
                <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                  <p className='text-md text-red-400'>
                    Insufficient ETH balance. You need approximately{' '}
                    {(calculationResults.totalPriceETH + 0.01).toFixed(4)} ETH to complete this renewal (including gas
                    costs).
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
                (extensionMode === 'extend_to' && customDate === 0)
              }
              className='w-full'
            >
              {isLoading
                ? 'Extending...'
                : !hasSufficientBalance
                  ? 'Insufficient ETH Balance'
                  : domains.length === 1 ? `Extend ${domains[0].name}` : `Extend ${domains.length} Name${domains.length > 1 ? 's' : ''}`}
            </PrimaryButton>
          )}
          <SecondaryButton onClick={handleClose} className='w-full' disabled={isLoading}>
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default ExtendModal
