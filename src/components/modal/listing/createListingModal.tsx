'use client'

import { useEffect, useState } from 'react'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import DatePicker from '@/components/ui/datepicker'
import { DAY_IN_SECONDS } from '@/constants/time'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import { Address, Check } from 'ethereum-identity-kit'
import EthereumIcon from 'public/tokens/eth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import FilterSelector from '@/components/filters/components/FilterSelector'
import OpenSeaIcon from 'public/logos/opensea.svg'
import GrailsIcon from 'public/logo.png'
import Image from 'next/image'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import { useSeaportContext } from '@/context/seaport'
import { mainnet } from 'viem/chains'
import { cn } from '@/utils/tailwind'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ClaimPoap from '../poap/claimPoap'
import { useUserContext } from '@/context/user'
import Price from '@/components/ui/price'

export type ListingStatus =
  | 'review'
  | 'checking_approval'
  | 'approving'
  | 'submitting'
  | 'cancelling'
  | 'success'
  | 'error'
const currentTimestamp = Math.floor(Date.now() / 1000)

interface CreateListingModalProps {
  onClose: () => void
  domain: MarketplaceDomainType | null
  previousListing: DomainListingType | null
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose, domain, previousListing }) => {
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { userAddress } = useUserContext()
  const { isCorrectChain, checkChain, createListing, isLoading, getCurrentChain, cancelListings } = useSeaportContext()

  const [price, setPrice] = useState<number | ''>('')
  const [currency, setCurrency] = useState<'ETH' | 'USDC'>('ETH')
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<ListingStatus>('review')
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)
  const [createListingTxHash, setCreateListingTxHash] = useState<string | null>(null)
  const [expiryDate, setExpiryDate] = useState<number>(currentTimestamp + DAY_IN_SECONDS * 30)

  useEffect(() => {
    getCurrentChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!domain) return null
  const { token_id: tokenId, name: ensName } = domain

  const durationOptions: DropdownOption[] = [
    { value: currentTimestamp + DAY_IN_SECONDS, label: '1 Day' },
    { value: currentTimestamp + DAY_IN_SECONDS * 7, label: '1 Week' },
    { value: currentTimestamp + DAY_IN_SECONDS * 30, label: '1 Month' },
    { value: currentTimestamp + DAY_IN_SECONDS * 90, label: '3 Months' },
    { value: 0, label: 'Custom' },
  ]

  const currencyOptions: DropdownOption[] = [
    { value: 'ETH', label: 'ETH (Ethereum)', icon: EthereumIcon },
    { value: 'USDC', label: 'USDC (USD Coin)', icon: UsdcIcon },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('checking_approval')
    setError(null)

    if (!userAddress) {
      setError('Wallet not connected')
      setStatus('error')
      return
    }

    if (!price) {
      setError('Price is required')
      setStatus('error')
      return
    }

    if (expiryDate === 0) {
      setError('Please select an expiry date')
      setStatus('error')
      return
    }

    try {
      const params: any = {
        ensName,
        tokenId,
        priceInEth: price.toString(),
        expiryDate,
        marketplace: selectedMarketplace,
        currency,
        setStatus,
        setApproveTxHash,
        setCreateListingTxHash,
        setError,
      }

      const result = await createListing(params)

      if (!result.success) {
        setError(result.error || 'Failed to create listing')
        setStatus('error')
        throw new Error(result.error || 'Failed to create listing')
      }

      if (previousListing) {
        setStatus('cancelling')

        try {
          const result = await cancelListings([previousListing.id])
          console.log('Cancellation result:', result)
        } catch (err) {
          setError('Failed to cancel listing')
          setStatus('error')
          throw new Error(`Failed to cancel listing: ${err}`)
        }
      }

      setStatus('success')
    } catch (err) {
      console.error('Failed to create listing:', err)
    }
  }

  // Calculate fees to show user
  const calculateFees = () => {
    if (!price) return null

    const fees: { label: string; amount: number }[] = []

    if (selectedMarketplace.includes('opensea')) {
      fees.push({ label: 'OpenSea Fee (1%)', amount: price * 0.01 })
    }

    if (selectedMarketplace.includes('grails')) {
      fees.push({ label: 'Grails Fee (0%)', amount: price * 0.0 })
    }

    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
    const netProceeds = price - totalFees

    return { fees, totalFees, netProceeds }
  }

  const successMessage = () => {
    if (previousListing) {
      return `Listing for ${domain.name} was edited successfully. The new listing is now active on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'} for ${price} ${currency}!`
    } else {
      return `${domain.name} was listed successfully on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'} for ${price} ${currency}!`
    }
  }

  const getModalContent = () => {
    switch (status) {
      case 'review':
        return (
          <div className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <div className='flex w-full items-center justify-between gap-2'>
                <p className='font-sedan-sc text-2xl'>Name</p>
                <p className='max-w-2/3 truncate font-semibold'>{ensName}</p>
              </div>
              {previousListing && (
                <div className='flex w-full items-center justify-between gap-2'>
                  <p className='font-sedan-sc text-2xl'>Current Price</p>
                  <Price
                    price={previousListing.price}
                    currencyAddress={previousListing.currency_address as Address}
                    fontSize='text-xl font-semibold'
                    iconSize='16px'
                    alignTooltip='right'
                  />
                </div>
              )}
            </div>
            <div className='border-tertiary p-md flex flex-col gap-1 rounded-md border'>
              <label className='p-md mb-2 block pb-0 text-xl font-medium'>Marketplace</label>
              <div className='flex flex-col gap-0.5'>
                <div
                  onClick={() => {
                    setSelectedMarketplace(
                      selectedMarketplace.includes('grails')
                        ? selectedMarketplace.filter((marketplace) => marketplace !== 'grails')
                        : [...selectedMarketplace, 'grails']
                    )
                  }}
                  className='p-md hover:bg-secondary flex w-full cursor-pointer items-center justify-between rounded-md transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    <Image src={GrailsIcon} alt='Grails' width={24} height={24} />
                    <p className='font-sedan-sc text-2xl'>Grails</p>
                  </div>
                  <FilterSelector
                    onClick={() =>
                      setSelectedMarketplace(
                        selectedMarketplace.includes('grails')
                          ? selectedMarketplace.filter((marketplace) => marketplace !== 'grails')
                          : [...selectedMarketplace, 'grails']
                      )
                    }
                    isActive={selectedMarketplace.includes('grails')}
                  />
                </div>
                <div
                  onClick={() => {
                    setSelectedMarketplace(
                      selectedMarketplace.includes('opensea')
                        ? selectedMarketplace.filter((marketplace) => marketplace !== 'opensea')
                        : [...selectedMarketplace, 'opensea']
                    )
                  }}
                  className='hover:bg-primary/10 flex w-full cursor-pointer items-center justify-between rounded-md p-2 transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    <Image src={OpenSeaIcon} alt='OpenSea' width={24} height={24} />
                    <p className='text-xl font-bold'>OpenSea</p>
                  </div>
                  <FilterSelector
                    onClick={() =>
                      setSelectedMarketplace(
                        selectedMarketplace.includes('opensea')
                          ? selectedMarketplace.filter((marketplace) => marketplace !== 'opensea')
                          : [...selectedMarketplace, 'opensea']
                      )
                    }
                    isActive={selectedMarketplace.includes('opensea')}
                  />
                </div>
              </div>
            </div>

            <div className='relative z-20'>
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
                <DatePicker
                  onSelect={(timestamp) => setExpiryDate(timestamp)}
                  onClose={() => {
                    setShowDatePicker(false)
                  }}
                  className='absolute top-14 left-0 w-full'
                />
              )}
            </div>

            <div>
              <Dropdown
                label='Currency'
                options={currencyOptions}
                value={currency}
                onSelect={(value) => setCurrency(value as 'ETH' | 'USDC')}
              />
            </div>

            <div>
              <Input
                type='number'
                label='Price'
                value={price}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') setPrice('')
                  else setPrice(Number(value))
                }}
                placeholder='0.1'
                min={0}
                step={0.001}
              />
            </div>

            {/* Fee breakdown */}
            {price && calculateFees() ? (
              <div className='bg-secondary border-tertiary text-md rounded-md border p-3'>
                <div className='space-y-1'>
                  <div className='flex justify-between text-gray-400'>
                    <span>Listing Price:</span>
                    <span>
                      {price} {currency}
                    </span>
                  </div>
                  {calculateFees()!.fees.map((fee, idx) => (
                    <div
                      key={idx}
                      className={cn('flex justify-between', fee.amount > 0 ? 'text-red-400' : 'text-green-400')}
                    >
                      <span>- {fee.label}:</span>
                      <span>
                        {fee.amount.toFixed(currency === 'USDC' ? 2 : 4)} {currency}
                      </span>
                    </div>
                  ))}
                  <div className='bg-primary my-2 h-px w-full' />
                  <div className='flex items-center justify-between font-medium'>
                    <span>You Receive:</span>
                    <span className='text-lg font-bold'>
                      {calculateFees()!.netProceeds.toLocaleString('default', {
                        maximumFractionDigits: 6,
                        minimumFractionDigits: 2,
                      })}{' '}
                      {currency}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            {/* {status && (
                <div className="text-blue-500 text-sm">{status}</div>
              )} */}

            {/* {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )} */}
            <div className='flex flex-col gap-2'>
              <PrimaryButton
                disabled={
                  isLoading ||
                  !price ||
                  selectedMarketplace.length === 0 ||
                  expiryDate < currentTimestamp ||
                  !userAddress
                }
                onClick={
                  isCorrectChain
                    ? handleSubmit
                    : (e) => checkChain({ chainId: mainnet.id, onSuccess: () => handleSubmit(e) })
                }
                className='h-10 w-full'
              >
                {isCorrectChain
                  ? isLoading
                    ? 'Submitting Listing...'
                    : selectedMarketplace.length === 0
                      ? 'Select a marketplace'
                      : `List on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0] === 'grails' ? 'Grails' : 'OpenSea'}`
                  : 'Switch Chain'}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='h-10 w-full'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )

      case 'checking_approval':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Checking Approval</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>
                Checking if you have approved the NFT collection for{' '}
                {selectedMarketplace.length > 1
                  ? 'Grails and OpenSea'
                  : selectedMarketplace[0] === 'grails'
                    ? 'Grails'
                    : 'OpenSea'}
              </p>
            </div>
          </>
        )

      case 'approving':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Approving NFT Transfer</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Approving Seaport to transfer your Name</p>
              {approveTxHash && (
                <a
                  href={`https://etherscan.io/tx/${approveTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </>
        )

      case 'submitting':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Confirm in Wallet</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Submitting listing to the blockchain</p>
              {createListingTxHash && (
                <a
                  href={`https://etherscan.io/tx/${createListingTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </>
        )

      case 'cancelling':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Cancelling Old Listing</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>
                You might be asked to sign a transaction to cancel the old listing. (depends on the marketplace)
              </p>
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div className='flex flex-col items-center justify-between gap-4 py-2 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='text-xl font-bold'>{successMessage()}</div>
            </div>
            <SecondaryButton onClick={onClose} disabled={isLoading} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        )

      case 'error':
        return (
          <>
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='mb-4 text-2xl font-bold text-red-400'>Transaction Failed</h2>
              <p className='line-clamp-6 text-red-400'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton onClick={() => setStatus('review')} className='w-full'>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div
      onClick={() => {
        if (status === 'error' || status === 'review' || status === 'success') {
          onClose()
        }
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background p-lg sm:p-xl relative flex max-h-[calc(100dh-80px)] w-full flex-col gap-4 overflow-y-auto border-t md:max-w-sm md:rounded-md md:border-2'
        style={{ margin: '0 auto', maxWidth: '28rem' }}
      >
        {status === 'success' && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <h2 className='font-sedan-sc min-h-6 max-w-full truncate text-center text-3xl text-white'>
              {previousListing ? 'Edit Listing' : 'List Name'}
            </h2>
            {getModalContent()}
          </>
        )}
      </div>
    </div>
  )
}

export default CreateListingModal
