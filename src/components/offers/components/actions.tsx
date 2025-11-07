import React from 'react'
import { Address } from 'viem'
import { DomainOfferType } from '@/types/domains'
import { useAppDispatch } from '@/state/hooks'
import {
  setCancelOfferModalName,
  setCancelOfferModalOffer,
  setCancelOfferModalOpen,
} from '@/state/reducers/modals/cancelOfferModal'
import { setAcceptOfferModalDomain, setAcceptOfferModalOffer, setAcceptOfferModalOpen } from '@/state/reducers/modals/acceptOfferModal'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'

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
    dispatch(setAcceptOfferModalDomain({
      name: offer.name,
      tokenId: offer.token_id,
      isWrapped: false,
    }))
  }

  if (!currentUserAddress) return null

  // Check if offer is expired or not active
  const isExpired = new Date(offer.expires_at) < new Date()
  const isActive = offer.status === 'pending' && !isExpired

  if (!isActive) return null

  // Determine user role
  const isBuyer = offer.buyer_address.toLowerCase() === currentUserAddress.toLowerCase()
  // const isSeller = offer.order_data?.parameters?.offerer.toLowerCase() === currentUserAddress.toLowerCase()

  if (isBuyer) {
    return (
      <SecondaryButton
        onClick={openCancelOfferModal}
      >
        Cancel
      </SecondaryButton>
    )
  }

  return (
    <PrimaryButton
      onClick={openAcceptOfferModal}
    >
      Accept
    </PrimaryButton>
  )

}

export default Actions
