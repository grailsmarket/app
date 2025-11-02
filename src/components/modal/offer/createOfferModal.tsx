'use client'

import { useMemo, useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { MarketplaceDomainType } from '@/types/domains'
import DatePicker from '@/components/ui/datepicker'
import Dropdown, { DropdownOption } from '@/components/ui/dropdown'
import WrappedEtherIcon from 'public/tokens/weth-circle.svg'
import UsdcIcon from 'public/tokens/usdc.svg'
import Input from '@/components/ui/input'
import FilterSelector from '@/components/filters/components/FilterSelector'
import Image from 'next/image'
import OpenSeaIcon from 'public/logos/opensea.svg'
import GrailsIcon from 'public/logo.png'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DAY_IN_SECONDS } from '@/constants/time'
import { Check } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'

interface CreateOfferModalProps {
  onClose: () => void
  domain: MarketplaceDomainType | null
}

const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ onClose, domain }) => {
  const { modifyCart } = useModifyCart()
  const { createOffer, isLoading } = useSeaportClient()

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [expiryDate, setExpiryDate] = useState<number>(Math.floor(new Date().getTime() / 1000))
  const [selectedMarketplace, setSelectedMarketplace] = useState<('opensea' | 'grails')[]>(['grails'])
  const [currency, setCurrency] = useState<'WETH' | 'USDC'>('WETH')
  const [price, setPrice] = useState<number>()
  const [success, setSuccess] = useState(false)

  const currentTimestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
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
    { value: 'WETH', label: 'WETH (Wrapped Ether)', icon: WrappedEtherIcon },
    { value: 'USDC', label: 'USDC (USD Coin)', icon: UsdcIcon },
  ]

  if (!domain) return null

  const { id: domainId, token_id: tokenId, name: ensName, owner: currentOwner } = domain

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    if (!currentOwner) {
      console.error('Domain is not registered')
      return
    }

    if (!price) {
      console.error('Price is required')
      return
    }

    if (expiryDate === 0) {
      console.error('Expiry date is required')
      return
    }

    try {
      await createOffer({
        tokenId: tokenId.toString(),
        price,
        currency,
        expiryDate,
        currentOwner,
        ensNameId: domainId,
        marketplace: ['grails'],
      })

      setSuccess(true)

      modifyCart({ domain, inCart: true, basket: 'OFFER' })

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      console.error('Failed to create offer:', err)
    }
  }

  return (
    <div className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center overflow-scroll bg-black/50 px-2 py-12 backdrop-blur-sm sm:px-4'>
      <div
        className='bg-background border-primary p-md sm:p-xl relative flex h-fit w-full max-w-md flex-col gap-2 rounded-md border-2'
        style={{ margin: '0 auto', maxWidth: '28rem' }}
      >
        <h2 className='font-sedan-sc pb-2 text-center text-2xl'>Make Offer</h2>

        {success ? (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 text-xl font-bold'>Offer Created Successfully!</div>
            </div>
            <SecondaryButton onClick={onClose} disabled={isLoading} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        ) : (
          <div className='space-y-4'>
            <div className='flex w-full items-center justify-between gap-2'>
              <p className='font-sedan-sc text-2xl'>Name</p>
              <p className='max-w-2/3 truncate font-semibold'>{ensName}</p>
            </div>
            <div className='border-primary p-lg flex flex-col gap-2 rounded-md border'>
              <label className='mb-2 block text-xl font-medium'>Marketplace</label>
              <div className='flex flex-col gap-4'>
                <div className='flex w-full items-center justify-between'>
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
                onSelect={(value) => setCurrency(value as 'WETH' | 'USDC')}
              />
            </div>

            <div>
              <Input
                type='number'
                label='Price'
                value={price}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '') setPrice(undefined)
                  else setPrice(Number(value))
                }}
                placeholder='0.1'
                min={0}
                step={0.001}
              />
            </div>

            <div className='text-center text-sm text-gray-400'>
              By making an offer, you&apos;re committing to purchase this NFT if the seller accepts. The offer will be
              signed with your wallet and stored on-chain.
            </div>

            <div className='flex flex-col gap-2'>
              <PrimaryButton
                disabled={isLoading || !price || selectedMarketplace.length === 0}
                onClick={handleSubmit}
                className='h-10 w-full'
              >
                {isLoading ? 'Submitting Offer...' : 'Make Offer'}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='h-10 w-full'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateOfferModal
