'use client'

import React, { useState } from 'react'
import { useClickAway } from '@/hooks/useClickAway'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { MarketplaceDomainType } from '@/types/domains'
import {
  setMakeListingModalDomains,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListings,
  addMakeListingModalPreviousListing,
} from '@/state/reducers/modals/makeListingModal'
import { setCancelListingModalListings, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import { REGISTERABLE_STATUSES, REGISTERED } from '@/constants/domains/registrationStatuses'
import { RegistrationStatus } from '@/types/domains'
import Image from 'next/image'
import CalendarIcon from 'public/icons/calendar-white.svg'
import OfferIcon from 'public/icons/bid.svg'
import CancelIcon from 'public/icons/cancelled.svg'
import ListIcon from 'public/icons/tag-white.svg'
import RegisterIcon from 'public/icons/registration-white.svg'
import BuyNowIcon from 'public/icons/cart.svg'
import { openRegistrationModal } from '@/state/reducers/registration'
import { setBuyNowModalDomain, setBuyNowModalListing, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'

interface ActionsDropdownProps {
  domain: MarketplaceDomainType
  isOwner: boolean
  registrationStatus: RegistrationStatus
  dropdownPosition?: 'left' | 'right'
  className?: string
}

const ThreeDotsIcon = () => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor' xmlns='http://www.w3.org/2000/svg'>
    <circle cx='8' cy='3' r='1.5' />
    <circle cx='8' cy='8' r='1.5' />
    <circle cx='8' cy='13' r='1.5' />
  </svg>
)

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  domain,
  isOwner,
  registrationStatus,
  dropdownPosition = 'left',
  className,
}) => {
  const dispatch = useAppDispatch()
  const [isOpen, setIsOpen] = useState(false)

  const dropdownRef = useClickAway(() => {
    setIsOpen(false)
  })

  const domainListing = domain.listings[0]
  const hasListing = Boolean(domainListing?.price)
  const isRegistered = registrationStatus === REGISTERED
  const isUnregistered = REGISTERABLE_STATUSES.includes(registrationStatus)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

  const handleExtendName = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setBulkRenewalModalDomains([domain]))
    dispatch(setBulkRenewalModalOpen(true))
    setIsOpen(false)
  }

  const handleMakeOffer = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setMakeOfferModalDomain(domain))
    dispatch(setMakeOfferModalOpen(true))
    setIsOpen(false)
  }

  const handleListOrEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setMakeListingModalDomains([domain]))
    dispatch(setMakeListingModalOpen(true))

    if (hasListing && domainListing) {
      dispatch(addMakeListingModalPreviousListing(domainListing))
    } else {
      dispatch(setMakeListingModalPreviousListings([]))
    }
    setIsOpen(false)
  }

  const handleCancelListing = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!domainListing) return

    dispatch(
      setCancelListingModalListings([
        {
          id: domainListing.id,
          name: domain.name,
          price: domainListing.price,
          currency: domainListing.currency_address,
          expires: domainListing.expires_at,
          source: domainListing.source,
        },
      ])
    )
    dispatch(setCancelListingModalOpen(true))
    setIsOpen(false)
  }

  const handleRegisterName = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(openRegistrationModal({ name: domain.name, domain: domain }))
    setIsOpen(false)
  }

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(domainListing))
    dispatch(setBuyNowModalOpen(true))
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className={cn('relative', className)}>
      <button
        onClick={handleToggle}
        className='hover:bg-tertiary hover:text-foreground text-neutral flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm transition-colors'
        aria-label='More actions'
      >
        <ThreeDotsIcon />
      </button>

      {isOpen && (
        <div
          className={cn(
            'bg-background border-tertiary absolute top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-md border-2 font-medium shadow-lg',
            dropdownPosition === 'left' ? 'right-0' : 'left-0'
          )}
        >
          {isRegistered && hasListing && (
            <button
              onClick={handleBuyNow}
              className='hover:bg-tertiary flex w-full items-center gap-1.5 px-3 py-2 text-left text-lg transition-colors'
            >
              <Image src={BuyNowIcon} alt='Buy Now' className='h-4 w-4' width={16} height={16} />
              <p>Buy Now</p>
            </button>
          )}
          {/* Extend Name - visible to everyone for registered names */}
          {isUnregistered ? (
            <button
              onClick={handleRegisterName}
              className='hover:bg-tertiary flex w-full items-center gap-1.5 px-3 py-2 text-left text-lg transition-colors'
            >
              <Image src={RegisterIcon} alt='Register Name' className='h-4 w-4' width={16} height={16} />
              <p>Register Name</p>
            </button>
          ) : (
            <button
              onClick={handleExtendName}
              className='hover:bg-tertiary flex w-full items-center gap-1.5 px-3 py-2 text-left text-lg transition-colors'
            >
              <Image src={CalendarIcon} alt='Extend Name' className='h-4 w-4' width={16} height={16} />
              <p>Extend Name</p>
            </button>
          )}

          {/* Make an Offer - visible to non-owners for registered names */}
          {isRegistered && !isOwner && (
            <button
              onClick={handleMakeOffer}
              className='hover:bg-tertiary flex w-full items-center gap-2 px-3 py-2 text-left text-lg transition-colors'
            >
              <Image src={OfferIcon} alt='Make an Offer' className='h-4 w-4' width={16} height={16} />
              <p>Make an Offer</p>
            </button>
          )}

          {/* List / Edit Listing - owner only for registered names */}
          {isRegistered && isOwner && (
            <button
              onClick={handleListOrEdit}
              className='hover:bg-tertiary flex w-full items-center gap-2 px-3 py-2 text-left text-lg transition-colors'
            >
              <Image src={ListIcon} alt='List Name' className='h-4 w-4' width={16} height={16} />
              <p>{hasListing ? 'Edit Listing' : 'List Name'}</p>
            </button>
          )}

          {/* Cancel Listing - owner only when listing exists */}
          {isRegistered && isOwner && hasListing && (
            <button
              onClick={handleCancelListing}
              className='hover:bg-tertiary flex w-full items-center gap-2 px-3 py-2 text-left text-lg text-red-400 transition-colors'
            >
              <Image src={CancelIcon} alt='Cancel Listing' className='h-4 w-4' width={16} height={16} />
              <p>Cancel Listing</p>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ActionsDropdown
