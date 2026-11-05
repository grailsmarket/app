import React from 'react'
import { Address } from 'viem'
import { DomainOfferType } from '@/types/domains'
import { useAppDispatch } from '@/state/hooks'
import {
  setCancelOfferModalName,
  setCancelOfferModalOffer,
  setCancelOfferModalOpen,
} from '@/state/reducers/modals/cancelOfferModal'
import {
  setAcceptOfferModalDomain,
  setAcceptOfferModalOffer,
  setAcceptOfferModalOpen,
} from '@/state/reducers/modals/acceptOfferModal'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import Tooltip from '@/components/ui/tooltip'
import { COMPROMISED_OFFER_TOOLTIP, isCompromisedCounterparty } from '@/utils/compromised'

interface ActionsProps {
  offer: DomainOfferType
  currentUserAddress?: Address
}

const Actions: React.FC<ActionsProps> = ({ offer, currentUserAddress }) => {
  const { userAddress, authStatus } = useUserContext()
  const dispatch = useAppDispatch()
  const openCancelOfferModal = () => {
    dispatch(setCancelOfferModalOpen(true))
    dispatch(setCancelOfferModalOffer(offer))
    dispatch(setCancelOfferModalName(offer.name))
  }

  const openAcceptOfferModal = () => {
    dispatch(setAcceptOfferModalOpen(true))
    dispatch(setAcceptOfferModalOffer(offer))
    dispatch(
      setAcceptOfferModalDomain({
        name: offer.name,
        tokenId: offer.token_id,
        isWrapped: false,
        compromised: offer.compromised ?? null,
      })
    )
  }

  if (!currentUserAddress) return null

  // Check if offer is expired or not active
  const isExpired = new Date(offer.expires_at) < new Date()
  const isActive = offer.status === 'pending' && !isExpired

  if (!isActive) return null

  // Determine user role
  const isBuyer = offer.buyer_address.toLowerCase() === userAddress?.toLowerCase() && authStatus === 'authenticated'
  const isSeller = currentUserAddress.toLowerCase() === userAddress?.toLowerCase() && authStatus === 'authenticated'

  if (isBuyer) {
    return <SecondaryButton onClick={openCancelOfferModal}>Cancel</SecondaryButton>
  }

  if (isSeller) {
    // Stolen name: only offers from the original owner can be accepted
    if (offer.compromised && !isCompromisedCounterparty(offer.compromised, offer.buyer_address)) {
      return (
        <Tooltip label={COMPROMISED_OFFER_TOOLTIP} position='top' align='right'>
          <PrimaryButton disabled>Accept</PrimaryButton>
        </Tooltip>
      )
    }
    return <PrimaryButton onClick={openAcceptOfferModal}>Accept</PrimaryButton>
  }

  return null
}

export default Actions
