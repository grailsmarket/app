import React from 'react'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setBuyNowModalDomain, setBuyNowModalOpen, setBuyNowModalListing } from '@/state/reducers/modals/buyNowModal'
import { UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { openRegistrationModal, selectRegistration } from '@/state/reducers/registration'
import { cn } from '@/utils/tailwind'

interface ActionButtonsProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ domain, registrationStatus }) => {
  const dispatch = useAppDispatch()
  const domainListing = domain.listings[0]
  const registrationState = useAppSelector(selectRegistration)

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

  const openRegistrationModalHandler = () => {
    if (!domain.name || !domain) return
    if (registrationState.flowState !== 'review') return
    dispatch(openRegistrationModal({ name: domain.name, domain: domain }))
  }

  const clickHandler = (e: React.MouseEvent, handler: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    handler()
  }

  if (registrationStatus === UNREGISTERED) {
    return (
      <button
        onClick={(e) => clickHandler(e, openRegistrationModalHandler)}
        className={cn(
          'border-primary text-primary hover:bg-primary hover:text-background h-10 w-24 cursor-pointer rounded-sm border-2 text-lg font-semibold transition-all duration-300',
          registrationState.flowState !== 'review' && 'cursor-not-allowed opacity-50'
        )}
      >
        Register
      </button>
    )
  }

  if (domainListing?.price) {
    return (
      <button
        onClick={(e) => clickHandler(e, openBuyNowModal)}
        className='border-primary text-primary hover:bg-primary hover:text-background font-bol h-10 w-[94px] cursor-pointer rounded-sm border-2 text-lg font-semibold transition-all duration-300 sm:w-24'
      >
        Buy Now
      </button>
    )
  }

  return (
    <button
      className={`border-primary text-primary hover:bg-primary hover:text-background h-10 w-20 cursor-pointer rounded-sm border-2 text-lg font-semibold transition-all duration-300 sm:w-24`}
      onClick={(e) => clickHandler(e, openMakeOfferModal)}
    >
      Offer
    </button>
  )
}

export default ActionButtons
