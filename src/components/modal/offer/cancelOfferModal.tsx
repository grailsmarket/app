'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { beautifyName } from '@/lib/ens'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DomainOfferType } from '@/types/domains'
import { useQueryClient } from '@tanstack/react-query'
import Price from '@/components/ui/price'
import { formatPrice } from '@/utils/formatPrice'
import { TOKENS } from '@/constants/web3/tokens'
import { track } from '@/lib/analytics'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import {
  IDLE_CANCEL,
  MARKETPLACE_NAMES,
  applyCancelProgress,
  getErrorParts,
  type CancelRun,
} from '../listing/seaport-progress'
import {
  BusyView,
  CloseFooter,
  ErrorView,
  NameSubject,
  RetryFooter,
  SuccessView,
  getBusyHint,
} from '../listing/seaport-views'
import { getCancelOfferBusyScreen } from './offer-screens'

interface CancelOfferModalProps {
  onClose: () => void
  name: string
  offer: DomainOfferType | null
}

const CancelOfferModal: React.FC<CancelOfferModalProps> = ({ onClose, name, offer }) => {
  const queryClient = useQueryClient()
  const { cancelOffer, isLoading } = useSeaportClient()
  // `idle` is the review; `pending` runs the cancel
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  // What the cancel reported: the onchain OpenSea cancel and its hash, then the API update
  const [cancelRun, setCancelRun] = useState<CancelRun>(IDLE_CANCEL)

  if (!offer) return null

  const ensName = beautifyName(name)
  const currency = TOKENS[offer.currency_address as keyof typeof TOKENS]
  const isOpenSea = offer.source === 'opensea'

  const handleCancelOffer = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setStatus('pending')
    setError(null)
    setErrorDetails(null)
    setCancelRun(IDLE_CANCEL)

    try {
      await cancelOffer(offer, (event) => setCancelRun((current) => applyCancelProgress(current, event)))
      setStatus('success')
      track('offer_cancelled', {
        name,
        offer_id: offer.id,
        source: offer.source ?? null,
        currency_address: offer.currency_address ?? null,
        amount_wei: offer.offer_amount_wei ?? null,
      })
    } catch (err) {
      console.error('Failed to cancel listing:', err)
      const { message, details } = getErrorParts(err, 'Failed to cancel offer')
      setError(message)
      setErrorDetails(details)
      setStatus('error')
    } finally {
      queryClient.invalidateQueries({
        queryKey: ['profile', 'sent_offers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['name', 'offers'],
      })
    }
  }

  const isBusy = status === 'pending'
  const busyScreen = isBusy ? getCancelOfferBusyScreen({ cancel: cancelRun, isOpenSea }) : null
  const amountLabel = `${formatPrice(offer.offer_amount_wei, currency)} ${currency}`
  const sourceLabel = MARKETPLACE_NAMES[offer.source as keyof typeof MARKETPLACE_NAMES] ?? offer.source

  const getModalContent = () => {
    if (busyScreen) return <BusyView screen={busyScreen} />

    if (status === 'success') {
      return (
        <SuccessView
          title='Offer Cancelled'
          message={`Your offer on ${ensName} for ${amountLabel} was cancelled.`}
          links={cancelRun.hash ? [{ key: 'cancel', label: 'View on Etherscan', hash: cancelRun.hash }] : undefined}
        />
      )
    }

    if (status === 'error') {
      return <ErrorView title='Cancellation Failed' error={error} details={errorDetails} />
    }

    return (
      <div className='flex flex-col gap-2'>
        <div className='flex justify-between'>
          <p className='font-sedan-sc text-label text-xl'>Name</p>
          <p className='max-w-2/3 truncate text-lg font-medium'>{ensName}</p>
        </div>
        <div className='flex justify-between'>
          <p className='font-sedan-sc text-label text-xl'>Price</p>
          <Price
            price={offer.offer_amount_wei}
            currencyAddress={offer.currency_address}
            fontSize='text-xl font-semibold'
            iconSize='16px'
            alignTooltip='right'
          />
        </div>
        <div className='flex justify-between'>
          <p className='font-sedan-sc text-label text-xl'>Expires</p>
          <p className='max-w-2/3 truncate text-lg font-medium'>{formatExpiryDate(offer.expires_at)}</p>
        </div>
      </div>
    )
  }

  const getFooter = () => {
    if (isBusy) return null
    if (status === 'success') return <CloseFooter onClose={onClose} />
    // Today's retry: the whole cancel again
    if (status === 'error') return <RetryFooter onRetry={() => handleCancelOffer()} onClose={onClose} />

    return (
      <>
        <PrimaryButton onClick={handleCancelOffer} disabled={isLoading} className={modalPrimaryActionClassName}>
          <p className='text-label text-lg font-bold'>{isLoading ? 'Cancelling Offer...' : 'Confirm'}</p>
        </PrimaryButton>
        <SecondaryButton onClick={onClose} disabled={isLoading} className={modalActionClassName}>
          <p className='text-label text-lg font-bold'>Close</p>
        </SecondaryButton>
      </>
    )
  }

  return (
    <ModalShell
      title='Cancel Offer'
      onClose={onClose}
      locked={isBusy}
      // As today: the scrim closes the review and the error, not the success
      dismissible={status === 'idle' || status === 'error'}
      stageKey={isBusy ? 'progress' : status}
      subject={
        status === 'idle' ? null : (
          <NameSubject
            names={[{ name, tokenId: offer.token_id, version: offer.version }]}
            compact={isBusy || status === 'error'}
            meta={
              status === 'success'
                ? 'Cancelled'
                : `Your offer · ${sourceLabel} · Expires ${new Date(offer.expires_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}`
            }
            price={
              <Price
                price={offer.offer_amount_wei}
                currencyAddress={offer.currency_address}
                fontSize='text-xl font-bold'
                iconSize='16px'
                alignTooltip='right'
              />
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

export default CancelOfferModal
