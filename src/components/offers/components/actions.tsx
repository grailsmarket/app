import React from 'react'
import { Address } from 'viem'
import { DomainOfferType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import {
  setCancelOfferModalName,
  setCancelOfferModalOffer,
  setCancelOfferModalOpen,
} from '@/state/reducers/modals/cancelOfferModal'
import { setAcceptOfferModalOffer, setAcceptOfferModalOpen } from '@/state/reducers/modals/acceptOfferModal'

interface ActionsProps {
  offer: DomainOfferType
  currentUserAddress?: Address
}

const Actions: React.FC<ActionsProps> = ({ offer, currentUserAddress }) => {
  const dispatch = useAppDispatch()
  const openCancelOfferModal = () => {
    dispatch(setCancelOfferModalOpen(true))
    dispatch(setCancelOfferModalOffer(offer))
    dispatch(setCancelOfferModalName(offer.name))
  }

  const openAcceptOfferModal = () => {
    dispatch(setAcceptOfferModalOpen(true))
    dispatch(setAcceptOfferModalOffer(offer))
    // dispatch(setAcceptOfferModalDomain(domain))
  }
  if (!currentUserAddress) return null

  // Check if offer is expired or not active
  const isExpired = new Date(offer.expires_at) < new Date()
  const isActive = offer.status === 'active' && !isExpired

  if (!isActive) return null

  // Determine user role
  const isBuyer = offer.buyer_address.toLowerCase() === currentUserAddress.toLowerCase()
  const isSeller =
    offer.order_data?.taker?.address &&
    offer.order_data.taker.address.toLowerCase() === currentUserAddress.toLowerCase()

  if (isBuyer) {
    return (
      <button
        onClick={openCancelOfferModal}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          'border border-red-500/50 text-red-500',
          'hover:bg-red-500/20'
        )}
      >
        Cancel
      </button>
    )
  }

  if (isSeller && !isBuyer) {
    return (
      <button
        onClick={openAcceptOfferModal}
        className={cn(
          'rounded-md px-3 py-1 text-xs font-medium transition-colors',
          'bg-primary text-background',
          'hover:opacity-80'
        )}
      >
        Accept
      </button>
    )
  }

  return null
}

export default Actions
