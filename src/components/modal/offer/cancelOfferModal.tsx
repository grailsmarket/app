'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { Check } from 'ethereum-identity-kit'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { beautifyName } from '@/lib/ens'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DomainOfferType } from '@/types/domains'
import { useQueryClient } from '@tanstack/react-query'
import Price from '@/components/ui/price'
import { formatPrice } from '@/utils/formatPrice'
import { TOKENS } from '@/constants/web3/tokens'

interface CancelOfferModalProps {
  onClose: () => void
  name: string
  offer: DomainOfferType | null
}

const CancelOfferModal: React.FC<CancelOfferModalProps> = ({ onClose, name, offer }) => {
  const queryClient = useQueryClient()
  const { cancelOffer, isLoading } = useSeaportClient()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')

  if (!offer) return null

  const ensName = beautifyName(name)
  const currency = TOKENS[offer.currency_address as keyof typeof TOKENS]

  const handleCancelOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')

    try {
      await cancelOffer(offer)
      setStatus('success')
    } catch (err) {
      console.error('Failed to cancel listing:', err)
      setStatus('error')
    } finally {
      queryClient.invalidateQueries({
        queryKey: ['portfolio', 'my_offers'],
      })
      queryClient.invalidateQueries({
        queryKey: ['name', 'offers'],
      })
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
        className='border-tertiary bg-background relative flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t p-4 md:max-w-md md:rounded-md md:border-2'
      >
        <div className='z-10 mb-4 flex min-h-6 items-center justify-center'>
          <h2 className='font-sedan-sc text-3xl'>Cancel Offer</h2>
        </div>

        {status === 'success' ? (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 max-w-4/5 text-center text-xl font-bold'>
                Offer on {ensName} for{' '}
                <span className='text-nowrap'>
                  {formatPrice(offer.offer_amount_wei, currency)} {currency}
                </span>{' '}
                was cancelled successfully!
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
            <div className='flex flex-col gap-2'>
              <PrimaryButton onClick={handleCancelOffer} disabled={isLoading} className='w-full'>
                <p className='text-label text-lg font-bold'>{isLoading ? 'Cancelling Offer...' : 'Confirm'}</p>
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

export default CancelOfferModal
