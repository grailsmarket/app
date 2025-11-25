'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { Address, Check } from 'ethereum-identity-kit'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { CancelListingListing } from '@/state/reducers/modals/cancelListingModal'
import { beautifyName } from '@/lib/ens'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Price from '@/components/ui/price'
import { formatPrice } from '@/utils/formatPrice'
import { TOKENS } from '@/constants/web3/tokens'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Image from 'next/image'

interface CancelListingModalProps {
  onClose: () => void
  listing: CancelListingListing | null
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({ onClose, listing }) => {
  const { cancelListings, isLoading } = useSeaportClient()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  if (!listing) return null

  const ensName = beautifyName(listing.name)
  const currency = TOKENS[listing.currency as keyof typeof TOKENS]
  const price = formatPrice(listing.price, currency)

  const handleCancelListing = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')

    try {
      await cancelListings([listing.id])
      setStatus('success')
    } catch (err) {
      console.error('Failed to cancel listing:', err)
      setStatus('error')
    }
  }

  return (
    <div
      onClick={() => {
        if (status === 'success' || status === 'pending') return
        onClose()
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background p-lg sm:p-xl relative flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t md:max-w-md md:rounded-md md:border-2'
      >
        <div className='z-10 mb-4 flex min-h-6 items-center justify-center'>
          <h2 className='font-sedan-sc min-h-6 text-3xl'>Cancel Listing</h2>
        </div>

        {status === 'success' ? (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 w-4/5 text-center text-xl font-bold'>
                Listing for{' '}
                <span className='text-nowrap'>
                  {price} {currency}
                </span>{' '}
                on <span className='capitalize'>{listing.source}</span> was cancelled successfully!
              </div>
            </div>
            <SecondaryButton onClick={onClose} disabled={isLoading} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        ) : (
          <>
            <div className='flex flex-col gap-2'>
              <div className='flex justify-between'>
                <p className='font-sedan-sc text-label text-xl'>Name</p>
                <p className='max-w-2/3 truncate text-lg font-medium'>{ensName}</p>
              </div>
              <div className='flex justify-between'>
                <p className='font-sedan-sc text-label text-xl'>Price</p>
                <Price
                  price={listing.price}
                  currencyAddress={listing.currency as Address}
                  fontSize='text-xl font-semibold'
                  iconSize='16px'
                  alignTooltip='right'
                />
              </div>
              <div className='flex justify-between'>
                <p className='font-sedan-sc text-label text-xl'>Expires</p>
                <p className='max-w-2/3 truncate text-lg font-medium'>{formatExpiryDate(listing.expires)}</p>
              </div>
              <div className='flex justify-between'>
                <p className='font-sedan-sc text-label text-xl'>Marketplace</p>
                <div className='flex items-center gap-1'>
                  <Image
                    src={SOURCE_ICONS[listing.source as keyof typeof SOURCE_ICONS]}
                    alt={listing.source}
                    width={24}
                    height={24}
                    className='h-5 w-auto'
                  />
                  <p className='text-lg font-medium capitalize'>{listing.source}</p>
                </div>
              </div>
            </div>
            {status === 'error' && (
              <div className='flex flex-col gap-2'>
                <p className='text-lg font-medium text-red-500'>Error: Failed to cancel listing</p>
              </div>
            )}
            <div className='mt-2 flex flex-col gap-2'>
              <PrimaryButton onClick={handleCancelListing} disabled={isLoading} className='w-full'>
                <p className='text-label text-lg font-bold'>{isLoading ? 'Cancelling Listing...' : 'Confirm'}</p>
              </PrimaryButton>
              <SecondaryButton onClick={onClose} disabled={isLoading} className='w-full'>
                <p className='text-label text-lg font-bold'>Close</p>
              </SecondaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CancelListingModal
