import React from 'react'
import { useFilterContext } from '@/context/filters'
import CartIcon from '../../table/components/CartIcon'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setCancelListingModalListing, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import {
  setMakeListingModalDomain,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListing,
} from '@/state/reducers/modals/makeListingModal'
import { setBuyNowModalDomain, setBuyNowModalListing, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import Watchlist from '@/components/ui/watchlist'
import { cn } from '@/utils/tailwind'
import {
  addBulkRenewalModalDomain,
  removeBulkRenewalModalDomain,
  selectBulkRenewalModal,
} from '@/state/reducers/modals/bulkRenewalModal'
import {
  addTransferModalDomain,
  removeTransferModalDomain,
  selectTransferModal,
} from '@/state/reducers/modals/transferModal'
import { Check } from 'ethereum-identity-kit'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'

interface ActionsProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  canAddToCart: boolean
  isFirstInRow?: boolean
  watchlistId?: number | undefined
  isBulkRenewing?: boolean
  isBulkTransferring?: boolean
}

const Actions: React.FC<ActionsProps> = ({
  domain,
  registrationStatus,
  canAddToCart,
  watchlistId,
  isBulkRenewing,
  isBulkTransferring,
  isFirstInRow,
}) => {
  const dispatch = useAppDispatch()
  const { filterType } = useFilterContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const domainListing = domain.listings[0]
  const { domains: bulkRenewalDomains } = useAppSelector(selectBulkRenewalModal)
  const { domains: bulkTransferDomains } = useAppSelector(selectTransferModal)
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')

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
    dispatch(setMakeListingModalDomain(domain))
    dispatch(setMakeListingModalOpen(true))
    if (grailsListings.length > 0) {
      dispatch(setMakeListingModalPreviousListing(grailsListings[0]))
    } else {
      dispatch(setMakeListingModalPreviousListing(null))
    }
  }

  const openCancelListingModal = () => {
    dispatch(
      setCancelListingModalListing({
        currency: domainListing.currency_address,
        expires: domainListing.expires_at,
        id: domainListing.id,
        name: domain.name,
        price: domainListing.price,
        source: domainListing.source,
      })
    )
    dispatch(setCancelListingModalOpen(true))
  }

  const clickHandler = (e: React.MouseEvent, handler: () => void) => {
    e.preventDefault()
    e.stopPropagation()
    handler()
  }

  if (filterType === 'portfolio') {
    if (selectedTab.value === 'domains') {
      if (isBulkRenewing) {
        const isSelected = bulkRenewalDomains.some((d) => d.name === domain.name)
        return (
          <div className='flex flex-row justify-end gap-4 opacity-100'>
            {isSelected ? (
              <PrimaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()

                  dispatch(removeBulkRenewalModalDomain(domain))
                }}
                className='flex flex-row items-center gap-1'
              >
                Selected
                <Check className='h-3 w-3' />
              </PrimaryButton>
            ) : (
              <SecondaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(addBulkRenewalModalDomain(domain))
                }}
              >
                Select
              </SecondaryButton>
            )}
          </div>
        )
      }
      if (isBulkTransferring) {
        const isSelected = bulkTransferDomains.some((d) => d.name === domain.name)
        return (
          <div className='flex flex-row justify-end gap-4 opacity-100'>
            {isSelected ? (
              <PrimaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(
                    removeTransferModalDomain({
                      name: domain.name,
                      tokenId: domain.token_id,
                      owner: domain.owner,
                      expiry_date: domain.expiry_date,
                    })
                  )
                }}
                className='flex flex-row items-center gap-1'
              >
                Selected
                <Check className='h-3 w-3' />
              </PrimaryButton>
            ) : (
              <SecondaryButton
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  dispatch(
                    addTransferModalDomain({
                      name: domain.name,
                      tokenId: domain.token_id,
                      owner: domain.owner,
                      expiry_date: domain.expiry_date,
                    })
                  )
                }}
              >
                Select
              </SecondaryButton>
            )}
          </div>
        )
      }
      if (registrationStatus !== REGISTERED) return null

      if (domainListing?.price) {
        return (
          <div className='py-md flex flex-row justify-end gap-4 opacity-100'>
            <p
              className='text-foreground/70 hover:text-foreground cursor-pointer text-lg font-bold transition-colors'
              onClick={(e) => clickHandler(e, openMakeListingModal)}
            >
              Edit
            </p>
            <p
              className='text-foreground/70 hover:text-foreground cursor-pointer text-lg font-bold transition-colors'
              onClick={(e) => clickHandler(e, openCancelListingModal)}
            >
              Cancel
            </p>
          </div>
        )
      }

      return (
        <div className='py-md flex flex-row justify-end opacity-100'>
          <p
            className='text-primary/80 hover:text-primary cursor-pointer text-lg font-bold transition-colors'
            onClick={(e) => clickHandler(e, openMakeListingModal)}
          >
            List
          </p>
        </div>
      )
    }
  }

  return (
    <div
      className={cn('flex w-full flex-row justify-between opacity-100', watchlistId ? 'items-end' : 'justify-between')}
    >
      {registrationStatus === UNREGISTERED ? (
        <button
          onClick={(e) =>
            clickHandler(e, () => window.open(`https://app.ens.domains/${domain.name}/register`, '_blank'))
          }
        >
          <p className='text-primary/80 hover:text-primary cursor-pointer py-1 text-lg font-bold transition-colors'>
            Register
          </p>
        </button>
      ) : domainListing?.price ? (
        <button onClick={(e) => clickHandler(e, openBuyNowModal)}>
          <p className='text-primary/80 hover:text-primary cursor-pointer py-1 text-lg font-bold transition-colors'>
            Buy Now
          </p>
        </button>
      ) : (
        <button onClick={(e) => clickHandler(e, openMakeOfferModal)}>
          <p className='text-primary/80 hover:text-primary cursor-pointer py-1 text-lg font-bold transition-colors'>
            Offer
          </p>
        </button>
      )}
      <div className={cn('flex items-center', watchlistId ? 'items-end' : 'gap-x-0')}>
        {watchlistId && (
          <div onClick={(e) => clickHandler(e, () => { })} className='flex flex-row items-center gap-0'>
            <Watchlist
              domain={domain}
              tooltipPosition='top'
              dropdownPosition={isFirstInRow ? 'right' : 'left'}
              watchlistId={watchlistId}
              showSettings={true}
              showSettingsArrow={false}
            />
          </div>
        )}
        {canAddToCart && (
          <button className='cursor-pointer rounded-sm' disabled={!canAddToCart}>
            <CartIcon domain={domain} className='p-0' />
          </button>
        )}
      </div>
    </div>
  )
}

export default Actions
