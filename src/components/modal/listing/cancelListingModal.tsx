'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { Address } from 'ethereum-identity-kit'
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
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import type { MarketplaceType } from '@/lib/seaport/seaportClient'
import { IDLE_CANCEL, applyCancelProgress, getErrorParts, marketplaceLabel, type CancelRun } from './seaport-progress'
import { BusyView, CloseFooter, ErrorView, NameSubject, RetryFooter, SuccessView, getBusyHint } from './seaport-views'
import { getCancelListingsBusyScreen, getCancelListingsPartial, getCancelListingsSuccess } from './listing-screens'

interface CancelListingModalProps {
  onClose: () => void
  listings: CancelListingListing[]
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({ onClose, listings }) => {
  // TODO: User will update internal logic to handle multiple listings
  const dispatch = useAppDispatch()
  const { cancelListings, isLoading } = useSeaportClient()
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  // What the cancel reported: the Grails API cancel, then the onchain OpenSea cancel and its hash
  const [cancelRun, setCancelRun] = useState<CancelRun>(IDLE_CANCEL)

  if (!listings.length) return null

  const handleCancelListings = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setStatus('pending')
    setError(null)
    setErrorDetails(null)
    setCancelRun(IDLE_CANCEL)

    try {
      await cancelListings(
        listings.map((listing) => listing.id),
        (event) => setCancelRun((current) => applyCancelProgress(current, event))
      )
      setStatus('success')
    } catch (err) {
      console.error('Failed to cancel listing:', err)
      const { message, details } = getErrorParts(err, 'Failed to cancel listing')
      setError(message)
      setErrorDetails(details)
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

  // Grails listings are removed through the API; OpenSea listings need an onchain cancel
  const openSeaListings = listings.filter((listing) => listing.source === 'opensea')
  const grailsCount = listings.length - openSeaListings.length
  const sources: MarketplaceType[] = [
    ...(grailsCount > 0 ? (['grails'] as const) : []),
    ...(openSeaListings.length > 0 ? (['opensea'] as const) : []),
  ]
  const isBusy = status === 'pending'
  const busyScreen = isBusy
    ? getCancelListingsBusyScreen({
        cancel: cancelRun,
        total: listings.length,
        grailsCount,
        openSeaCount: openSeaListings.length,
      })
    : null

  const getModalContent = () => {
    if (busyScreen) return <BusyView screen={busyScreen} />

    if (status === 'success') {
      const success = getCancelListingsSuccess({
        names: listings.map((listing) => beautifyName(listing.name)),
        total: listings.length,
        sources,
      })

      return (
        <SuccessView
          title={success.title}
          message={success.message}
          links={cancelRun.hash ? [{ key: 'cancel', label: 'View on Etherscan', hash: cancelRun.hash }] : undefined}
        />
      )
    }

    if (status === 'error') {
      return (
        <ErrorView
          title='Cancellation Failed'
          warning={getCancelListingsPartial({
            cancel: cancelRun,
            grailsCount,
            openSeaNames: openSeaListings.map((listing) => beautifyName(listing.name)),
          })}
          error={error}
          details={errorDetails}
        />
      )
    }

    return (
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
    )
  }

  const getFooter = () => {
    if (isBusy) return null
    if (status === 'success') return <CloseFooter onClose={handleClose} />
    // Today's retry: the same cancel again, for every listing in the modal
    if (status === 'error') return <RetryFooter onRetry={() => handleCancelListings()} onClose={handleClose} />

    return (
      <>
        <PrimaryButton onClick={handleCancelListings} disabled={isLoading} className={modalPrimaryActionClassName}>
          {isLoading ? (
            <p>Cancelling Listing...</p>
          ) : (
            <p>
              Cancel {listings.length} {listings.length > 1 ? 'Listings' : 'Listing'} on{' '}
              <span className='capitalize'>{listings[0].source}</span>
            </p>
          )}
        </PrimaryButton>
        <SecondaryButton onClick={handleClose} disabled={isLoading} className={modalActionClassName}>
          <p className='text-label text-lg font-bold'>Close</p>
        </SecondaryButton>
      </>
    )
  }

  const firstListing = listings[0]

  return (
    <ModalShell
      title={listings.length > 1 ? 'Cancel Listings' : 'Cancel Listing'}
      onClose={handleClose}
      locked={isBusy}
      // As today: the scrim closes the review and the error, not the success
      dismissible={status === 'idle' || status === 'error'}
      stageKey={isBusy ? 'progress' : status}
      subject={
        status === 'idle' ? null : (
          <NameSubject
            names={listings.map((listing) => ({ name: listing.name }))}
            label={`${listings.length} listings`}
            compact={isBusy || status === 'error'}
            meta={status === 'success' ? 'No longer listed' : marketplaceLabel(sources)}
            price={
              listings.length === 1 ? (
                <Price
                  price={firstListing.price}
                  currencyAddress={firstListing.currency as Address}
                  fontSize='text-xl font-bold'
                  iconSize='16px'
                  alignTooltip='right'
                />
              ) : undefined
            }
          />
        )
      }
      footer={getFooter()}
      footerHint={busyScreen ? getBusyHint(busyScreen) : undefined}
    >
      {getModalContent()}
    </ModalShell>
  )
}

export default CancelListingModal
