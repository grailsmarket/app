'use client'

import { useMemo, useState } from 'react'
import { MarketplaceDomainType } from '@/types/domains'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import WrappedEtherIcon from 'public/tokens/weth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import DatePicker from '@/components/ui/datepicker'
import Image from 'next/image'
import Calendar from 'public/icons/calendar.svg'
import { DAY_IN_SECONDS } from '@/constants/time'
import { Check } from 'ethereum-identity-kit'
import { useSeaportContext } from '@/context/seaport'
import { mainnet } from 'viem/chains'
import { useAccount, useBalance } from 'wagmi'
import { parseUnits } from 'viem'
import { WETH_ADDRESS, USDC_ADDRESS, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { beautifyName } from '@/lib/ens'
import Label from '@/components/ui/label'
import { cn } from '@/utils/tailwind'
import ArrowDownIcon from 'public/icons/arrow-down.svg'

type BulkOfferStatus = 'review' | 'signing' | 'submitting' | 'success' | 'error'

interface BulkOfferModalProps {
  onClose: () => void
  domains: MarketplaceDomainType[]
}

const BulkOfferModal: React.FC<BulkOfferModalProps> = ({ onClose, domains }) => {
  const { createBulkOffer, isLoading } = useSeaportContext()
  const { address } = useAccount()

  const [status, setStatus] = useState<BulkOfferStatus>('review')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showIndividualPrices, setShowIndividualPrices] = useState(false)
  const [currency, setCurrency] = useState<'WETH' | 'USDC'>('WETH')
  const [defaultPrice, setDefaultPrice] = useState<number | ''>('')
  const [individualPrices, setIndividualPrices] = useState<Map<string, number>>(new Map())
  const [resultData, setResultData] = useState<{ created: number; failed: number } | null>(null)

  const currentTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const [expiryDate, setExpiryDate] = useState<number>(currentTimestamp + DAY_IN_SECONDS * 7)

  const durationOptions: DropdownOption[] = [
    { value: currentTimestamp + DAY_IN_SECONDS, label: '1 Day' },
    { value: currentTimestamp + DAY_IN_SECONDS * 7, label: '1 Week' },
    { value: currentTimestamp + DAY_IN_SECONDS * 30, label: '1 Month' },
    { value: currentTimestamp + DAY_IN_SECONDS * 90, label: '3 Months' },
    { value: 0, label: 'Custom' },
  ]

  const currencyOptions: DropdownOption[] = [
    { value: 'WETH', label: 'WETH (Wrapped Ether)', icon: WrappedEtherIcon },
    { value: 'USDC', label: 'USDC (USD Coin)', icon: UsdcIcon },
  ]

  const { data: wethBalance } = useBalance({
    address,
    token: WETH_ADDRESS as `0x${string}`,
    chainId: mainnet.id,
  })

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS as `0x${string}`,
    chainId: mainnet.id,
  })

  const totalCost = useMemo(() => {
    let total = 0
    for (const domain of domains) {
      total += individualPrices.get(domain.name) ?? (typeof defaultPrice === 'number' ? defaultPrice : 0)
    }
    return total
  }, [domains, defaultPrice, individualPrices])

  const hasSufficientBalance = useMemo(() => {
    if (!totalCost) return true
    const selectedBalance = currency === 'WETH' ? wethBalance : usdcBalance
    if (!selectedBalance) return false
    const decimals = TOKEN_DECIMALS[currency]
    const costInWei = parseUnits(totalCost.toString(), decimals)
    return selectedBalance.value >= costInWei
  }, [totalCost, currency, wethBalance, usdcBalance])

  const currentBalanceFormatted = useMemo(() => {
    const selectedBalance = currency === 'WETH' ? wethBalance : usdcBalance
    if (!selectedBalance) return '0'
    const decimals = TOKEN_DECIMALS[currency]
    const balance = Number(selectedBalance.value) / Math.pow(10, decimals)
    return balance.toFixed(6)
  }, [currency, wethBalance, usdcBalance])

  const canSubmit = typeof defaultPrice === 'number' && defaultPrice > 0 && expiryDate > 0 && hasSufficientBalance

  const handleSubmit = async () => {
    if (!canSubmit) return

    setStatus('signing')
    setErrorMessage(null)

    try {
      const result = await createBulkOffer({
        domains,
        price: defaultPrice as number,
        prices: individualPrices.size > 0 ? individualPrices : undefined,
        currency,
        expiryDate,
      })

      setResultData({ created: result.created, failed: result.failed })
      setStatus('success')
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create bulk offers')
      setStatus('error')
    }
  }

  const isInteracting = status === 'signing' || status === 'submitting' || isLoading

  return (
    <div
      onClick={() => {
        if (isInteracting) return
        onClose()
      }}
      className='fixed inset-0 z-50 flex min-h-[100dvh] w-screen items-end justify-center bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-start md:overflow-y-auto md:p-4 md:py-[5vh] starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='border-tertiary bg-background relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t p-4 md:max-h-none md:max-w-lg md:rounded-md md:border-2 md:p-6'
      >
        {/* Header */}
        <div className='flex items-center justify-center gap-2'>
          <h2 className='font-sedan-sc min-h-6 text-center text-3xl'>Bulk Offer</h2>
        </div>

        {status === 'success' ? (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 text-xl font-bold'>
                {resultData?.created} Offer{resultData?.created !== 1 ? 's' : ''} Created!
              </div>
              {resultData && resultData.failed > 0 && (
                <p className='text-sm text-red-400'>
                  {resultData.failed} offer{resultData.failed !== 1 ? 's' : ''} failed
                </p>
              )}
            </div>
            <SecondaryButton onClick={onClose} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        ) : status === 'error' ? (
          <>
            <div className='flex flex-col items-center gap-2 py-4 text-center'>
              <p className='text-lg font-bold text-red-400'>Error</p>
              <p className='text-sm text-red-400'>{errorMessage}</p>
            </div>
            <div className='flex flex-col gap-2'>
              <PrimaryButton onClick={() => setStatus('review')} className='w-full'>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        ) : (
          <div className='space-y-3'>
            {/* Currency */}
            <div className='z-20'>
              <Dropdown
                label='Currency'
                options={currencyOptions}
                value={currency}
                onSelect={(value) => setCurrency(value as 'WETH' | 'USDC')}
              />
            </div>

            {/* Duration */}
            <div className='z-10 flex flex-col gap-2'>
              <Dropdown
                label='Duration'
                placeholder='Select a duration'
                options={durationOptions}
                value={expiryDate}
                onSelect={(value) => {
                  setExpiryDate(Number(value))
                  if (Number(value) === 0) setShowDatePicker(true)
                }}
              />
              {expiryDate === 0 && showDatePicker && (
                <div className='xs:p-4 absolute top-0 right-0 z-10 flex h-full w-full items-start justify-start bg-black/40 p-3 backdrop-blur-sm md:p-6'>
                  <DatePicker
                    onSelect={(timestamp) => setExpiryDate(timestamp)}
                    onClose={() => setShowDatePicker(false)}
                    className='w-full'
                  />
                </div>
              )}
              <button
                onClick={() => {
                  setExpiryDate(0)
                  setShowDatePicker(true)
                }}
                className='text-primary mx-auto flex cursor-pointer flex-row items-center gap-2 transition-opacity hover:opacity-80'
              >
                <p>Select a custom date</p>
                <Image src={Calendar} alt='calendar' width={18} height={18} />
              </button>
            </div>

            {/* Default Price */}
            <div>
              <Input
                type='number'
                label='Base Price'
                value={defaultPrice}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') setDefaultPrice('')
                  else setDefaultPrice(Number(value))
                }}
                placeholder='0.01'
                min={0}
                step={0.001}
                labelClassName='min-w-[110px]!'
                suffix={currency}
              />
              <div className='py-sm px-md mt-1 flex items-center justify-between'>
                <p className='text-md text-gray-400'>
                  Balance: {currentBalanceFormatted} {currency}
                </p>
              </div>
            </div>

            <div className='flex flex-col gap-2'>
              {/* Individual Prices Toggle */}
              <button
                onClick={() => setShowIndividualPrices(!showIndividualPrices)}
                className='text-md bg-secondary hover:bg-tertiary border-tertiary flex w-full cursor-pointer items-center justify-between gap-2 rounded-md border px-3 py-2 transition-colors'
              >
                <p className='text-xl font-semibold'>Edit offer prices</p>
                <div className='flex items-center gap-2'>
                  <p className='text-xl font-bold'>{domains.length}</p>
                  <Image
                    src={ArrowDownIcon}
                    alt='Arrow Down'
                    width={16}
                    height={16}
                    className={cn(showIndividualPrices ? 'rotate-180' : '')}
                  />
                </div>
              </button>

              {/* Individual Price Overrides */}
              {showIndividualPrices && (
                <div className='flex flex-col gap-2'>
                  {domains.map((domain) => (
                    <div key={domain.token_id} className='flex items-center justify-between gap-2'>
                      <Input
                        type='number'
                        label={beautifyName(domain.name)}
                        className='w-full rounded-md text-right'
                        placeholder={typeof defaultPrice === 'number' ? defaultPrice.toString() : '0'}
                        value={individualPrices.get(domain.name) ?? ''}
                        onChange={(e) => {
                          const newPrices = new Map(individualPrices)
                          if (e.target.value === '') {
                            newPrices.delete(domain.name)
                          } else {
                            newPrices.set(domain.name, Number(e.target.value))
                          }
                          setIndividualPrices(newPrices)
                        }}
                        min={0}
                        step={0.001}
                        suffix={currency}
                        labelClassName='min-w-[200px]!'
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className='bg-secondary flex items-center justify-between rounded-md p-3'>
              <p className='text-md font-medium'>Total</p>
              <p className={cn('text-lg font-bold', !hasSufficientBalance && 'text-red-400')}>
                {totalCost.toFixed(6)} {currency}
              </p>
            </div>

            {/* Status message during signing */}
            {status === 'signing' && (
              <div className='bg-secondary flex items-center gap-2 rounded-md p-3'>
                <div className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                <p className='text-md'>Sign bulk offer for {domains.length} names...</p>
              </div>
            )}

            {/* Actions */}
            <div className='flex flex-col gap-2'>
              <PrimaryButton disabled={!canSubmit || isInteracting} onClick={handleSubmit} className='h-10 w-full'>
                {!hasSufficientBalance
                  ? `Insufficient ${currency} Balance`
                  : isInteracting
                    ? 'Processing...'
                    : `Make ${domains.length} Offer${domains.length !== 1 ? 's' : ''}`}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} disabled={isInteracting} className='h-10 w-full'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BulkOfferModal
