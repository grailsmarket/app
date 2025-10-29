'use client'

import { useMemo, useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import DatePicker from '@/components/ui/datepicker'
import { DAY_IN_SECONDS } from '@/constants/time'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import { Check } from 'ethereum-identity-kit'
import EthereumIcon from 'public/tokens/eth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import FilterSelector from '@/components/filters/components/FilterSelector'
import OpenSeaIcon from 'public/logos/opensea.svg'
import GrailsIcon from 'public/logo.png'
import Image from 'next/image'

interface CreateListingModalProps {
  onClose: () => void
  domain: MarketplaceDomainType | null
}

const CreateListingModal: React.FC<CreateListingModalProps> = ({ onClose, domain }) => {
  const { createListing, isLoading } = useSeaportClient()
  const [price, setPrice] = useState<number>()
  const [expiryDate, setExpiryDate] = useState<number>(Math.floor(new Date().getTime() / 1000))
  const [currency, setCurrency] = useState<'ETH' | 'USDC'>('ETH')
  const [includeRoyalty, setIncludeRoyalty] = useState(false)
  const [royaltyBps, setRoyaltyBps] = useState('250') // 2.5% default
  const [royaltyRecipient, setRoyaltyRecipient] = useState('')
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [success, setSuccess] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])

  if (!domain) return null
  const { token_id: tokenId, name: ensName } = domain

  const durationOptions: DropdownOption[] = [
    { value: currentTimestamp + DAY_IN_SECONDS, label: '1 Day' },
    { value: currentTimestamp + DAY_IN_SECONDS * 3, label: '3 Days' },
    { value: currentTimestamp + DAY_IN_SECONDS * 7, label: '1 Week' },
    { value: currentTimestamp + DAY_IN_SECONDS * 14, label: '2 Weeks' },
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
    setSuccess(false)
    setError(null)

    if (expiryDate === 0) {
      console.error('Please select an expiry date')
      setError('Please select an expiry date')
      return
    }

    try {
      const params: any = {
        tokenId,
        priceInEth: price.toString(),
        expiryDate,
        marketplace: selectedMarketplace,
        currency,
      }

      if (includeRoyalty && royaltyRecipient) {
        params.royaltyBps = parseInt(royaltyBps)
        params.royaltyRecipient = royaltyRecipient
      }

      await createListing(params)
      setSuccess(true)

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
        setError(null)
        setSelectedMarketplace(['grails'])
        setCurrency('ETH')
      }, 2000)
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

    if (includeRoyalty && royaltyBps) {
      const royaltyPercent = parseInt(royaltyBps) / 100
      fees.push({ label: `Creator Royalty (${royaltyPercent}%)`, amount: price * (royaltyPercent / 100) })
    }

    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0)
    const netProceeds = price - totalFees

    return { fees, totalFees, netProceeds }
  }

  return (
    <div className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center overflow-scroll bg-black/40 px-2 py-12 sm:px-4'>
      <div
        className='bg-background border-primary p-md sm:p-xl relative flex h-fit w-full max-w-sm flex-col gap-4 rounded-sm border-2'
        style={{ margin: '0 auto', maxWidth: '28rem' }}
      >
        <h2 className='font-sedan-sc max-w-full truncate text-center text-3xl text-white'>List Domain</h2>

        {success ? (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 text-xl font-bold'>Listing Cancelled Successfully!</div>
            </div>
            <SecondaryButton onClick={onClose} disabled={isLoading} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        ) : (
          <div className='flex flex-col gap-4'>
            <div className='flex w-full items-center justify-between gap-2'>
              <p className='font-sedan-sc text-2xl'>Name</p>
              <p className='max-w-2/3 truncate font-semibold'>{ensName}</p>
            </div>
            <div className='flex flex-col gap-2 border-primary border-2 rounded-md p-lg'>
              <label className='mb-2 block font-medium text-xl'>Marketplace</label>
              <div className='flex flex-col gap-4'>
                <div className='flex w-full items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Image src={GrailsIcon} alt='Grails' width={24} height={24} />
                    <p className='text-2xl font-sedan-sc'>Grails</p>
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
                <div className='flex w-full items-center justify-between'>
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
                onChange={(value) => setPrice(value)}
                placeholder='0.1'
                min={0}
                step={0.001}
              />
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
                  className='absolute top-16 left-0 mt-4 w-full'
                />
              )}
            </div>

            <div className='space-y-3'>
              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='includeRoyalty'
                  checked={includeRoyalty}
                  onChange={(e) => setIncludeRoyalty(e.target.checked)}
                  className='mr-2'
                />
                <label htmlFor='includeRoyalty' className='text-sm text-gray-300'>
                  Include royalty fee
                </label>
              </div>

              {includeRoyalty && (
                <>
                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-300'>Royalty Percentage</label>
                    <div className='flex items-center'>
                      <input
                        type='number'
                        step='0.1'
                        min='0'
                        max='100'
                        value={(parseInt(royaltyBps) / 100).toString()}
                        onChange={(e) => setRoyaltyBps((parseFloat(e.target.value) * 100).toString())}
                        className='w-24 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none'
                      />
                      <span className='ml-2 text-gray-300'>%</span>
                    </div>
                  </div>

                  <div>
                    <label className='mb-2 block text-sm font-medium text-gray-300'>Royalty Recipient Address</label>
                    <input
                      type='text'
                      value={royaltyRecipient}
                      onChange={(e) => setRoyaltyRecipient(e.target.value)}
                      className='w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-purple-500 focus:outline-none'
                      placeholder='0x...'
                      pattern='^0x[a-fA-F0-9]{40}$'
                    />
                  </div>
                </>
              )}
            </div>

            {/* Fee breakdown */}
            {(price > 0 && calculateFees()) ? (
              <div className='bg-secondary border-tertiary text-md rounded-md border p-3'>
                <div className='space-y-1'>
                  <div className='flex justify-between text-gray-400'>
                    <span>Listing Price:</span>
                    <span>
                      {price} {currency}
                    </span>
                  </div>
                  {calculateFees()!.fees.map((fee, idx) => (
                    <div key={idx} className='flex justify-between text-red-400'>
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
                      {calculateFees()!.netProceeds.toFixed(currency === 'USDC' ? 2 : 4)} {currency}
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

            {error && (
              <div className="text-red-500 text-lg text-center">Error: {error}</div>
            )}

            <div className='flex flex-col gap-2'>
              <PrimaryButton disabled={isLoading || !price || selectedMarketplace.length === 0} onClick={handleSubmit} className='w-full h-10'>
                {isLoading
                  ? 'Submitting Listing...'
                  : selectedMarketplace.length === 0 ? 'Select a marketplace' : `List on ${selectedMarketplace.length > 1 ? 'Grails and OpenSea' : selectedMarketplace[0]}`}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full h-10'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateListingModal
