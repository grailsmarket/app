import React from 'react'
import { useFilterContext } from '@/context/filters'
import CartIcon from '../../table/components/CartIcon'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { GRACE_PERIOD, REGISTERABLE_STATUSES, REGISTERED } from '@/constants/domains/registrationStatuses'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setCancelListingModalListings, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import {
  setMakeListingModalDomains,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListings,
} from '@/state/reducers/modals/makeListingModal'
import { setBuyNowModalDomain, setBuyNowModalListing, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import { cn } from '@/utils/tailwind'
import {
  selectBulkSelect,
  addBulkSelectDomain,
  removeBulkSelectDomain,
  addBulkSelectPreviousListing,
  removeBulkSelectPreviousListing,
} from '@/state/reducers/modals/bulkSelectModal'
import { Check } from 'ethereum-identity-kit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { openRegistrationModal } from '@/state/reducers/registration'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import ActionsDropdown from '@/components/domains/actionsDropdown'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'

interface ActionsProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  canAddToCart: boolean
  isFirstInRow?: boolean
  watchlistId?: number | undefined
  isBulkSelecting?: boolean
}

const Actions: React.FC<ActionsProps> = ({
  domain,
  registrationStatus,
  canAddToCart,
  watchlistId,
  isBulkSelecting,
  isFirstInRow,
}) => {
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const { filterType, categoryTab } = useFilterContext()
  const { selectedTab: profileTab } = useAppSelector(selectUserProfile)
  const domainListing = domain.listings[0]
  const { domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const isSelected = isBulkSelecting && selectedDomains.some((d: MarketplaceDomainType) => d.name === domain.name)
  const isMyDomain = userAddress?.toLowerCase() === domain.owner?.toLowerCase()

  const openBuyNowModal = () => {
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(domain.listings[0]))
    dispatch(setBuyNowModalOpen(true))
  }

  const openMakeOfferModal = () => {
    dispatch(setMakeOfferModalDomain(domain))
    dispatch(setMakeOfferModalOpen(true))
  }

  const openMakeListingModal = () => {
    if (!domain) return
    dispatch(setMakeListingModalDomains([domain]))
    dispatch(setMakeListingModalOpen(true))
    if (grailsListings.length > 0) {
      dispatch(setMakeListingModalPreviousListings(grailsListings))
    } else {
      dispatch(setMakeListingModalPreviousListings([]))
    }
  }

  const openExtendModal = () => {
    dispatch(setBulkRenewalModalDomains([domain]))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const openCancelListingModal = () => {
    dispatch(
      setCancelListingModalListings([
        {
          currency: domainListing.currency_address,
          expires: domainListing.expires_at,
          id: domainListing.id,
          name: domain.name,
          price: domainListing.price,
          source: domainListing.source,
        },
      ])
    )
    dispatch(setCancelListingModalOpen(true))
  }

  const handleOpenRegistrationModal = () => {
    dispatch(openRegistrationModal({ name: domain.name, domain: domain }))
  }

  const clickHandler = (e: React.MouseEvent, handler: () => void) => {
    e.preventDefault()
    e.stopPropagation()

    // User needs to be connected to make any actions on the domain
    if (!userAddress) return openConnectModal?.()

    handler()
  }

  if (filterType === 'profile' || filterType === 'category') {
    if (
      profileTab.value === 'domains' ||
      profileTab.value === 'listings' ||
      profileTab.value === 'grace' ||
      profileTab.value === 'watchlist' ||
      categoryTab?.value === 'names' ||
      categoryTab?.value === 'premium' ||
      categoryTab?.value === 'available'
    ) {
      if (isBulkSelecting) {
        return (
          <div className='flex flex-row justify-end gap-4 opacity-100'>
            {isSelected ? (
              <PrimaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(removeBulkSelectDomain(domain))
                  if (grailsListings.length > 0) {
                    grailsListings.forEach((listing) => dispatch(removeBulkSelectPreviousListing(listing)))
                  }
                }}
                className='border-primary flex h-fit! w-fit! flex-row items-center gap-1 border-2 px-2.5! py-[5px]!'
              >
                Selected
                <Check className='h-3 w-3' />
              </PrimaryButton>
            ) : (
              <SecondaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(addBulkSelectDomain(domain))
                  if (grailsListings.length > 0) {
                    grailsListings.forEach((listing) => dispatch(addBulkSelectPreviousListing(listing)))
                  }
                }}
                className='border-tertiary h-fit! w-fit! border-2 px-2.5! py-[5px]!'
              >
                Select
              </SecondaryButton>
            )}
          </div>
        )
      }

      if (isMyDomain) {
        if (registrationStatus === REGISTERED) {
          if (domainListing?.price) {
            return (
              <div className='flex flex-row justify-end gap-1 opacity-100'>
                <button
                  className='border-foreground/20 hover:bg-foreground/20 text-foreground/60 hover:text-foreground cursor-pointer rounded-sm border-2 px-2.5 py-1.5 text-lg font-bold'
                  onClick={(e) => clickHandler(e, openMakeListingModal)}
                >
                  Edit
                </button>
                <p
                  className='border-foreground/20 hover:bg-foreground/20 text-foreground/60 hover:text-foreground cursor-pointer rounded-sm border-2 px-2.5 py-1.5 text-lg font-bold'
                  onClick={(e) => clickHandler(e, openCancelListingModal)}
                >
                  Cancel
                </p>
              </div>
            )
          }

          return (
            <div className='flex flex-row justify-end opacity-100'>
              <p
                className='border-primary/70 hover:bg-primary text-primary/70 hover:text-background cursor-pointer rounded-sm border-2 px-2.5 py-1.5 text-lg font-bold'
                onClick={(e) => clickHandler(e, openMakeListingModal)}
              >
                List
              </p>
            </div>
          )
        }
      }
    }
  }

  return (
    <div
      className={cn('flex w-full flex-row justify-between opacity-100', watchlistId ? 'items-end' : 'justify-between')}
    >
      <div>
        {registrationStatus === GRACE_PERIOD ? (
          <button
            onClick={(e) => clickHandler(e, openExtendModal)}
            className='border-primary/70 hover:bg-primary text-primary/70 hover:text-background cursor-pointer rounded-sm border-2 px-2 py-1'
          >
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Extend</p>
          </button>
        ) : REGISTERABLE_STATUSES.includes(registrationStatus) ? (
          <button
            onClick={(e) => clickHandler(e, handleOpenRegistrationModal)}
            className='border-primary/70 hover:bg-primary text-primary/70 hover:text-background cursor-pointer rounded-sm border-2 px-2 py-1'
          >
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Register</p>
          </button>
        ) : domainListing?.price ? (
          <button
            className='border-primary/70 hover:bg-primary text-primary/70 hover:text-background cursor-pointer rounded-sm border-2 px-2 py-1'
            onClick={(e) => clickHandler(e, openBuyNowModal)}
          >
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Buy Now</p>
          </button>
        ) : (
          <button
            onClick={(e) => clickHandler(e, openMakeOfferModal)}
            className='border-primary/70 hover:bg-primary text-primary/70 hover:text-background cursor-pointer rounded-sm border-2 px-2 py-1'
          >
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Offer</p>
          </button>
        )}
      </div>
      <div className={cn('flex items-center', watchlistId ? 'items-end' : 'gap-x-0')}>
        {canAddToCart && (
          <button className='cursor-pointer rounded-sm' disabled={!canAddToCart}>
            <CartIcon domain={domain} className='p-0' />
          </button>
        )}
        {!isBulkSelecting && (
          <ActionsDropdown
            domain={domain}
            isOwner={isMyDomain}
            registrationStatus={registrationStatus}
            dropdownPosition={isFirstInRow ? 'right' : 'left'}
          />
        )}
      </div>
    </div>
  )
}

export default Actions
