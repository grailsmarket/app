import React from 'react'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { useAppDispatch } from '@/state/hooks'
import PrimaryButton from '@/components/ui/buttons/primary'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setBuyNowModalDomain, setBuyNowModalOpen, setBuyNowModalListing } from '@/state/reducers/modals/buyNowModal'
import { UNREGISTERED } from '@/constants/domains/registrationStatuses'

interface ActionButtonsProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ domain, registrationStatus }) => {
  const dispatch = useAppDispatch()
  const domainListing = domain.listings[0]

  const openBuyNowModal = () => {
    if (!domainListing) return
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(domainListing))
    dispatch(setBuyNowModalOpen(true))
  }

  const openMakeOfferModal = () => {
    dispatch(setMakeOfferModalDomain(domain))
    dispatch(setMakeOfferModalOpen(true))
  }

  const clickHandler = (e: React.MouseEvent, handler: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    handler()
  }

  if (registrationStatus === UNREGISTERED) {
    return (
      <PrimaryButton
        onClick={(e) => clickHandler(e, () => window.open(`https://app.ens.domains/${domain.name}/register`, '_blank'))}
        className='w-24'
      >
        Register
      </PrimaryButton>
    )
  }

  if (domainListing?.price) {
    return (
      <PrimaryButton onClick={(e) => clickHandler(e, openBuyNowModal)} className='w-[94px] sm:w-24'>
        Buy Now
      </PrimaryButton>
    )
  }

  return (
    <PrimaryButton
      className={`w-20 sm:w-24 cursor-pointer rounded-sm p-1.5`}
      onClick={(e) => clickHandler(e, openMakeOfferModal)}
    >
      Offer
    </PrimaryButton>
  )
}

export default ActionButtons
