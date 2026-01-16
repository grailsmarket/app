import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React, { MouseEventHandler, useMemo } from 'react'
import CartIcon from './CartIcon'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import {
  setMakeListingModalDomains,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListings,
  addMakeListingModalPreviousListing,
} from '@/state/reducers/modals/makeListingModal'
import { setCancelListingModalListings, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import Watchlist from '@/components/ui/watchlist'
import {
  selectBulkSelect,
  addBulkSelectDomain,
  removeBulkSelectDomain,
  addBulkSelectPreviousListing,
  removeBulkSelectPreviousListing,
} from '@/state/reducers/modals/bulkSelectModal'
import { Check } from 'ethereum-identity-kit'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/context/user'
import { GRACE_PERIOD, REGISTERABLE_STATUSES, REGISTERED } from '@/constants/domains/registrationStatuses'
import { openRegistrationModal } from '@/state/reducers/registration'
import ActionsDropdown from '@/components/domains/actionsDropdown'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setBuyNowModalDomain, setBuyNowModalListing, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'

interface ActionsProps {
  domain: MarketplaceDomainType
  index: number
  columnCount: number
  canAddToCart: boolean
  watchlistId?: number | undefined
  isBulkSelecting?: boolean
  registrationStatus: RegistrationStatus
}

const Actions: React.FC<ActionsProps> = ({
  domain,
  canAddToCart,
  index,
  columnCount,
  watchlistId,
  isBulkSelecting,
  registrationStatus,
}) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { filterType, categoryTab } = useFilterContext()
  const { userAddress, authStatus } = useUserContext()
  const { domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const { selectedTab: profileTab } = useAppSelector(selectUserProfile)
  const width = ALL_MARKETPLACE_COLUMNS['actions'].getWidth(columnCount)
  const domainListing = domain.listings[0]
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const isSelected = isBulkSelecting && selectedDomains.some((d) => d.name === domain.name)
  const isMyDomain = useMemo(
    () => userAddress?.toLowerCase() === domain.owner?.toLowerCase() && authStatus === 'authenticated',
    [userAddress, authStatus, domain.owner]
  )
  const isUnregistered = REGISTERABLE_STATUSES.includes(registrationStatus)

  const openBuyNowModal = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(domainListing))
    dispatch(setBuyNowModalOpen(true))
  }

  const openListModal = (e: React.MouseEvent<Element, MouseEvent>, editListing: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setMakeListingModalDomains([domain]))
    dispatch(setMakeListingModalOpen(true))

    if (editListing && domainListing) {
      dispatch(addMakeListingModalPreviousListing(domainListing))
    } else {
      dispatch(setMakeListingModalPreviousListings([]))
    }
  }

  const openRegistrationModalHandler = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(openRegistrationModal({ name: domain.name, domain: domain }))
  }

  const openCancelListingModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
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
  }

  const openOfferModal = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setMakeOfferModalDomain(domain))
    dispatch(setMakeOfferModalOpen(true))
  }

  const openExtendModal = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setBulkRenewalModalDomains([domain]))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const availableAction = useMemo(() => {
    if (isUnregistered) {
      return {
        label: 'Reg',
        onClick: (e: React.MouseEvent<Element, MouseEvent>) => openRegistrationModalHandler(e),
      }
    }

    if (registrationStatus === REGISTERED) {
      if (domainListing?.price) {
        if (isMyDomain) {
          return {
            label: 'Edit',
            onClick: (e: React.MouseEvent<Element, MouseEvent>) => openListModal(e, true),
          }
        }

        return {
          label: 'Buy',
          onClick: (e: React.MouseEvent<Element, MouseEvent>) => openBuyNowModal(e),
        }
      }

      if (isMyDomain) {
        return {
          label: 'List',
          onClick: (e: React.MouseEvent<Element, MouseEvent>) => openListModal(e, true),
        }
      }

      return {
        label: 'Offer',
        onClick: (e: React.MouseEvent<Element, MouseEvent>) => openOfferModal(e),
      }
    }

    if (registrationStatus === GRACE_PERIOD) {
      return {
        label: 'Extend',
        onClick: (e: React.MouseEvent<Element, MouseEvent>) => openExtendModal(e),
      }
    }

    return null

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainListing, registrationStatus, isMyDomain])

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
          <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
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
                className='flex flex-row items-center gap-1'
              >
                <p>Selected</p>
                <Check className='text-background h-3 w-3' />
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
              >
                Select
              </SecondaryButton>
            )}
          </div>
        )
      }

      if (isMyDomain && profileTab.value !== 'watchlist') {
        if (domainListing?.price) {
          return (
            <>
              <div className={cn('hidden flex-row justify-end gap-2 opacity-100 sm:flex', width)}>
                <SecondaryButton
                  className='border-foreground/20 hover:bg-foreground/20 text-foreground/60 hover:text-foreground cursor-pointer rounded-sm border-2 bg-transparent text-lg font-bold'
                  onClick={(e) => openListModal(e, true)}
                >
                  Edit
                </SecondaryButton>
                <SecondaryButton
                  className='border-foreground/20 hover:bg-foreground/20 text-foreground/60 hover:text-foreground cursor-pointer rounded-sm border-2 bg-transparent text-lg font-bold'
                  onClick={openCancelListingModal}
                >
                  Cancel
                </SecondaryButton>
              </div>
              <div className={cn('flex flex-row justify-end sm:hidden', width)}>
                <SecondaryButton
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    router.push(`/${domain.name}`)
                  }}
                >
                  Edit
                </SecondaryButton>
              </div>
            </>
          )
        }

        if (registrationStatus !== GRACE_PERIOD) {
          return (
            <div className={cn('hidden flex-row justify-end gap-2 opacity-100 sm:flex', width)}>
              <PrimaryButton
                onClick={(e) => openListModal(e, false)}
                className={cn(
                  'border-primary/80 text-primary hover:bg-primary! hover:text-background flex w-16! flex-row items-center justify-center gap-2 border-2 bg-transparent opacity-100 hover:opacity-100',
                  width
                )}
              >
                List
              </PrimaryButton>
            </div>
          )
        }
      }
    }
  }

  // if (REGISTERABLE_STATUSES.includes(registrationStatus)) {
  //   return (
  //     <div className={cn('flex flex-row items-center justify-end opacity-100', width)}>
  //       <PrimaryButton onClick={(e) => openRegistrationModalHandler(e)}>Register</PrimaryButton>
  //     </div>
  //   )
  // }

  return (
    <div className={cn('flex flex-row items-center justify-end opacity-100', width)}>
      <div className='flex h-7 items-center gap-1'>
        {canAddToCart && !isMyDomain && !watchlistId && (
          <button className={`cursor-pointer rounded-sm p-0 pr-0.5`}>
            <CartIcon domain={domain} />
          </button>
        )}
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className='flex h-7 w-fit flex-row items-center justify-center gap-1'
        >
          <Watchlist
            domain={domain}
            showSettings={watchlistId ? true : false}
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
            dropdownPosition='left'
            watchlistId={watchlistId}
          />
        </div>
        {!isBulkSelecting && !isUnregistered && (
          <ActionsDropdown
            domain={domain}
            isOwner={isMyDomain}
            registrationStatus={registrationStatus}
            dropdownPosition='left'
          />
        )}
        {availableAction && (
          <PrimaryButton
            className={cn(
              'border-primary/80 text-primary hover:bg-primary! hover:text-background ml-1 flex w-12 max-w-12 min-w-12 items-center justify-center border-2 bg-transparent p-0! text-nowrap hover:opacity-100 sm:w-18! sm:max-w-18! sm:min-w-18!',
              availableAction.label !== 'Reg' ? 'hidden md:block' : '',
              watchlistId ? 'hidden sm:block' : ''
            )}
            onClick={availableAction.onClick}
          >
            {availableAction.label}
          </PrimaryButton>
        )}
      </div>
    </div>
  )
}

export default Actions
