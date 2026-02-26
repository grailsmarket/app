'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { Address, Check } from 'ethereum-identity-kit'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { CancelListingListing, setCancelListingModalListings } from '@/state/reducers/modals/cancelListingModal'
import { beautifyName } from '@/lib/ens'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import Price from '@/components/ui/price'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Image from 'next/image'
import { clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { useAppDispatch } from '@/state/hooks'
import { cn } from '@/utils/tailwind'

interface CancelListingModalProps {
  onClose: () => void
  listings: CancelListingListing[]
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({ onClose, listings }) => {
  // TODO: User will update internal logic to handle multiple listings
  const dispatch = useAppDispatch()
  const { cancelListings, isLoading } = useSeaportClient()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  if (!listings.length) return null

  const handleCancelListings = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')

    try {
      await cancelListings(listings.map((listing) => listing.id))
      setStatus('success')
    } catch (err) {
      console.error('Failed to cancel listing:', err)
      setStatus('error')
    }
  }

  const handleClose = () => {
    if (status === 'pending') return

    if (status === 'success') {
      dispatch(clearBulkSelect())
    }

    dispatch(setCancelListingModalListings([]))
    onClose()
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        if (status === 'success' || status === 'pending') return
        handleClose()
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
              <div className='mb-2 text-center text-xl font-bold'>
                Listings for {listings.map((listing) => listing.name).join(', ')} on{' '}
                <span className='capitalize'>{listings[0].source}</span> was cancelled successfully!
              </div>
            </div>
            <SecondaryButton onClick={handleClose} disabled={isLoading} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        ) : (
          <>
            <div className='px-lg py-md bg-secondary flex max-h-[300px] flex-col overflow-y-auto rounded-lg'>
              {listings.length > 1 && (
                <div className='flex justify-between border-b border-b-white/30 py-2'>
                  <p className='font-sedan-sc text-label text-xl'>Names</p>
                  <p className='max-w-2/3 truncate text-xl font-bold'>{listings.length}</p>
                </div>
              )}
              {listings.map((listing, index) => (
                <div key={listing.id} className={cn('flex flex-col gap-2 py-2', index > 0 && 'border-t border-white/30')}>
                  <div className='flex justify-between'>
                    <p className='font-sedan-sc text-label text-xl'>Name</p>
                    <p className='max-w-2/3 truncate text-xl font-bold'>{beautifyName(listing.name)}</p>
                  </div>
                  <div className='flex justify-between'>
                    <p className='font-sedan-sc text-label text-xl'>Price</p>
                    <Price
                      price={listing.price}
                      currencyAddress={listing.currency as Address}
                      fontSize='text-xl font-semibold'
                      iconSize='16px'
                      alignTooltip='right'
                      tooltipPosition={index === 0 ? 'bottom' : 'top'}
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
              ))}
            </div>
            {status === 'error' && (
              <div className='flex flex-col gap-2'>
                <p className='text-lg font-medium text-red-500'>Error: Failed to cancel listing</p>
              </div>
            )}
            <div className='mt-2 flex flex-col gap-2'>
              <PrimaryButton onClick={handleCancelListings} disabled={isLoading} className='w-full'>
                {isLoading ? (
                  <p>Cancelling Listing...</p>
                ) : (
                  <p>
                    Cancel {listings.length} {listings.length > 1 ? 'Listings' : 'Listing'} on{' '}
                    <span className='capitalize'>{listings[0].source}</span>
                  </p>
                )}
              </PrimaryButton>
              <SecondaryButton onClick={handleClose} disabled={isLoading} className='w-full'>
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
