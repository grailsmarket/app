import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React, { MouseEventHandler } from 'react'
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
import { setCancelListingModalListing, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
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

interface ActionsProps {
  domain: MarketplaceDomainType
  index: number
  columnCount: number
  canAddToCart: boolean
  watchlistId?: number | undefined
  isBulkSelecting?: boolean
}

const Actions: React.FC<ActionsProps> = ({
  domain,
  canAddToCart,
  index,
  columnCount,
  watchlistId,
  isBulkSelecting,
}) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { filterType } = useFilterContext()
  const { domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const { selectedTab } = useAppSelector(selectUserProfile)
  const width = ALL_MARKETPLACE_COLUMNS['actions'].getWidth(columnCount)
  const domainListing = domain.listings[0]
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const isSelected = isBulkSelecting && selectedDomains.some((d) => d.name === domain.name)

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

  const openCancelListingModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(
      setCancelListingModalListing({
        id: domainListing.id,
        name: domain.name,
        price: domainListing.price,
        currency: domainListing.currency_address,
        expires: domainListing.expires_at,
        source: domainListing.source,
      })
    )
    dispatch(setCancelListingModalOpen(true))
  }

  if (filterType === 'portfolio') {
    if (selectedTab.value === 'domains') {
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

      if (domainListing?.price) {
        return (
          <>
            <div className={cn('hidden flex-row justify-end gap-2 opacity-100 sm:flex', width)}>
              <SecondaryButton onClick={(e) => openListModal(e, true)}>Edit</SecondaryButton>
              <SecondaryButton onClick={openCancelListingModal}>Cancel</SecondaryButton>
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
      return (
        <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
          <PrimaryButton onClick={(e) => openListModal(e, false)}>List</PrimaryButton>
        </div>
      )
    }
  }

  return (
    <div className={cn('flex flex-row items-center justify-end opacity-100', width)}>
      <div className='flex h-7 items-center gap-1'>
        {watchlistId && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className='flex flex-row items-center gap-2'
          >
            <Watchlist
              domain={domain}
              showSettings={true}
              tooltipPosition={index === 0 ? 'bottom' : 'top'}
              dropdownPosition='left'
              watchlistId={watchlistId}
            />
          </div>
        )}
        {canAddToCart && (
          <button className={`cursor-pointer rounded-sm p-1.5`}>
            <CartIcon domain={domain} />
          </button>
        )}
      </div>
    </div>
  )
}

export default Actions
