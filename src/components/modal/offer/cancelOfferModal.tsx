'use client'

import { useState } from 'react'
import { useSeaportClient } from '@/hooks/useSeaportClient'
import { Check } from 'ethereum-identity-kit'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { formatPrice } from '@/utils/formatPrice'
import { TOKENS } from '@/constants/web3/tokens'
import { beautifyName } from '@/lib/ens'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { DomainOfferType } from '@/types/domains'

interface CancelOfferModalProps {
  onClose: () => void
  name: string
  offer: DomainOfferType | null
}

const CancelOfferModal: React.FC<CancelOfferModalProps> = ({ onClose, name, offer }) => {
  const { cancelOffer, isLoading } = useSeaportClient()
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')

  if (!offer) return null

  const currency = TOKENS[offer.currency_address as keyof typeof TOKENS]

  const handleCancelOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('pending')

    try {
      await cancelOffer(offer.id)
      setStatus('success')
    } catch (err) {
      console.error('Failed to cancel listing:', err)
      setStatus('error')
    }
  }

  return (
    <div className='fixed top-0 right-0 bottom-0 left-0 z-[100] flex h-screen w-screen items-center justify-center overflow-scroll bg-black/50 px-2 py-12 backdrop-blur-sm sm:px-4'>
      <div className='bg-background border-primary p-md sm:p-xl relative flex h-fit w-full max-w-md flex-col gap-2 rounded-md border-2'>
        <div className='mb-4 flex items-center justify-center'>
          <h2 className='font-sedan-sc text-3xl'>Cancel Offer</h2>
        </div>

        {status === 'success' ? (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 text-xl font-bold'>Offer Cancelled Successfully!</div>
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
                <p className='max-w-2/3 truncate text-lg font-medium'>{beautifyName(name)}</p>
              </div>
              <div className='flex justify-between'>
                <p className='font-sedan-sc text-label text-xl'>Price</p>
                <p className='max-w-2/3 truncate text-lg font-medium'>
                  {formatPrice(offer.offer_amount_wei, currency)}
                </p>
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
