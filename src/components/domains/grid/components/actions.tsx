import React, { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
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
import { openRegistrationModal, selectRegistration } from '@/state/reducers/registration'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import ActionsDropdown from '@/components/domains/actionsDropdown'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import Watchlist from '@/components/ui/watchlist'

interface ActionsProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  isFirstInRow?: boolean
  watchlistId?: number | undefined
  isBulkSelecting?: boolean
  index?: number
}

const Actions: React.FC<ActionsProps> = ({
  domain,
  registrationStatus,
  watchlistId,
  isBulkSelecting,
  isFirstInRow,
  index,
}) => {
  const dispatch = useAppDispatch()
  const { userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const registrationState = useAppSelector(selectRegistration)
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
    if (registrationState.flowState !== 'review') return
    dispatch(openRegistrationModal({ name: domain.name, domain: domain }))
  }

  const clickHandler = (e: React.MouseEvent, handler: () => void) => {
    e.preventDefault()
    e.stopPropagation()

    // User needs to be connected to make any actions on the domain
    if (!userAddress) return openConnectModal?.()

    handler()
  }

  const primaryButtonClassName =
    'border-primary/50 hover:bg-primary w-full text-primary/70 hover:text-background rounded-none cursor-pointer border-y border-l px-2 h-10 transition-all duration-300'
  const secondaryButtonClassName =
    'bg-transparent hover:bg-tertiary w-full text-foreground/60 border-foreground/50 hover:text-foreground h-10 cursor-pointer rounded-none px-2.5 py-0.5 text-lg font-bold'

  const actionButton = useMemo(() => {
    if (isBulkSelecting) {
      return isSelected ? (
        <PrimaryButton
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            dispatch(removeBulkSelectDomain(domain))
            if (grailsListings.length > 0) {
              grailsListings.forEach((listing) => dispatch(removeBulkSelectPreviousListing(listing)))
            }
          }}
          className={cn(
            primaryButtonClassName,
            'bg-primary! text-background! flex w-full! flex-row items-center justify-center gap-1'
          )}
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
          className={cn(secondaryButtonClassName, 'bg-tertiary cursor-pointer')}
        >
          Select
        </SecondaryButton>
      )
    }

    if (isMyDomain) {
      if (registrationStatus === REGISTERED) {
        if (domainListing?.price) {
          return (
            <div className='flex w-full flex-row justify-end opacity-100'>
              <button
                className={cn(
                  secondaryButtonClassName,
                  'flex w-full! flex-row items-center justify-center gap-1 border-y border-l font-bold'
                )}
                onClick={(e) => clickHandler(e, openMakeListingModal)}
              >
                Edit
              </button>
              <p
                className={cn(
                  secondaryButtonClassName,
                  'flex w-full! flex-row items-center justify-center gap-1 border-y border-l font-bold'
                )}
                onClick={(e) => clickHandler(e, openCancelListingModal)}
              >
                Cancel
              </p>
            </div>
          )
        }

        return (
          <p
            className={cn(
              primaryButtonClassName,
              'flex w-full! flex-row items-center justify-center gap-1 border font-bold'
            )}
            onClick={(e) => clickHandler(e, openMakeListingModal)}
          >
            List
          </p>
        )
      }
    }

    if (registrationStatus === GRACE_PERIOD) {
      return (
        <button onClick={(e) => clickHandler(e, openExtendModal)} className={primaryButtonClassName}>
          <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Extend</p>
        </button>
      )
    }

    if (REGISTERABLE_STATUSES.includes(registrationStatus)) {
      return (
        <button onClick={(e) => clickHandler(e, handleOpenRegistrationModal)} className={primaryButtonClassName}>
          <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Register</p>
        </button>
      )
    }

    if (domainListing?.price) {
      return (
        <button onClick={(e) => clickHandler(e, openBuyNowModal)} className={primaryButtonClassName}>
          <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Buy Now</p>
        </button>
      )
    }

    return (
      <button onClick={(e) => clickHandler(e, openMakeOfferModal)} className={primaryButtonClassName}>
        <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Offer</p>
      </button>
    )
  }, [
    isBulkSelecting,
    isSelected,
    grailsListings,
    dispatch,
    primaryButtonClassName,
    secondaryButtonClassName,
    isMyDomain,
    registrationStatus,
    domainListing,
  ])

  return (
    <div
      className={cn('flex w-full flex-row justify-between opacity-100', watchlistId ? 'items-end' : 'justify-between')}
    >
      <div className='w-full'>
        {/* {registrationStatus === GRACE_PERIOD ? (
          <button onClick={(e) => clickHandler(e, openExtendModal)} className={primaryButtonClassName}>
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Extend</p>
          </button>
        ) : REGISTERABLE_STATUSES.includes(registrationStatus) ? (
          <button
            onClick={(e) => clickHandler(e, handleOpenRegistrationModal)}
            className={cn(
              primaryButtonClassName,
              registrationState.flowState !== 'review' && 'cursor-not-allowed opacity-50'
            )}
          >
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Register</p>
          </button>
        ) : domainListing?.price ? (
          <button className={primaryButtonClassName} onClick={(e) => clickHandler(e, openBuyNowModal)}>
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Buy Now</p>
          </button>
        ) : (
          <button onClick={(e) => clickHandler(e, openMakeOfferModal)} className={primaryButtonClassName}>
            <p className='cursor-pointer py-0.5 text-lg font-bold transition-colors'>Offer</p>
          </button>
        )} */}
        {actionButton}
      </div>
      {!isBulkSelecting && (
        <div className={cn('flex items-center', watchlistId ? 'items-end' : 'gap-x-0')}>
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className='border-foreground/55 hover:border-foreground/80 flex h-full w-10 flex-row items-center justify-center gap-1 border-y border-l'
          >
            <Watchlist
              domain={domain}
              showSettings={watchlistId ? true : false}
              tooltipPosition={index === 0 ? 'bottom' : 'top'}
              dropdownPosition='left'
              watchlistId={watchlistId || domain.watchlist_record_id}
              fetchWatchSettings={false}
            />
          </div>
          <ActionsDropdown
            domain={domain}
            isOwner={isMyDomain}
            registrationStatus={registrationStatus}
            dropdownPosition={isFirstInRow ? 'right' : 'left'}
            buttonClassName='rounded-none border-y border-x h-10 w-10 hover:bg-tertiary'
          />
        </div>
      )}
    </div>
  )
}

export default Actions
