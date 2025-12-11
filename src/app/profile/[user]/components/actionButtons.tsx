'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import useCartDomains from '@/hooks/useCartDomains'
import { persistor } from '@/state'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setBulkRenewalModalDomains, setBulkRenewalModalOpen } from '@/state/reducers/modals/bulkRenewalModal'
import { setTransferModalDomains, setTransferModalOpen } from '@/state/reducers/modals/transferModal'
import {
  setMakeListingModalDomains,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListings,
} from '@/state/reducers/modals/makeListingModal'
import {
  CancelListingListing,
  setCancelListingModalListings,
  setCancelListingModalOpen,
} from '@/state/reducers/modals/cancelListingModal'
import { selectBulkSelect, setBulkSelectIsSelecting, clearBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import React, { useMemo } from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { Address, Cross } from 'ethereum-identity-kit'

interface ActionButtonsProps {
  user: Address | undefined
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { userAddress, authStatus } = useUserContext()
  const { cartIsEmpty, clearCart } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { isSelecting, domains: selectedDomains, previousListings } = useAppSelector(selectBulkSelect)
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const isMyProfile = useMemo(
    () => user?.toLowerCase() === userAddress?.toLowerCase() && authStatus === 'authenticated',
    [user, userAddress, authStatus]
  )

  // const handleSelectAll = () => {
  //   dispatch(setBulkSelectDomains(visibleDomains))
  //   // Also collect previous listings from visible domains that have grails listings
  //   const allPreviousListings: DomainListingType[] = []
  //   visibleDomains.forEach((domain) => {
  //     const grailsListings = domain.listings?.filter((listing) => listing.source === 'grails') || []
  //     grailsListings.forEach((listing) => {
  //       if (!allPreviousListings.some((l) => l.id === listing.id)) {
  //         allPreviousListings.push(listing)
  //       }
  //     })
  //   })
  //   dispatch(setBulkSelectPreviousListings(allPreviousListings))
  // }

  const handleListAction = () => {
    dispatch(setMakeListingModalDomains(selectedDomains))
    dispatch(setMakeListingModalPreviousListings(previousListings))
    dispatch(setMakeListingModalOpen(true))
  }

  const handleExtendAction = () => {
    dispatch(setBulkRenewalModalDomains(selectedDomains))
    dispatch(setBulkRenewalModalOpen(true))
  }

  const handleTransferAction = () => {
    const transferDomains = selectedDomains.map((domain) => ({
      name: domain.name,
      tokenId: domain.token_id,
      owner: domain.owner,
      expiry_date: domain.expiry_date,
    }))
    dispatch(setTransferModalDomains(transferDomains))
    dispatch(setTransferModalOpen(true))
  }

  const handleCancelListingsAction = () => {
    // Transform previousListings (DomainListingType) to CancelListingListing format
    // We need to match each listing with its domain name
    const cancelListings: CancelListingListing[] = previousListings.map((listing) => {
      // Find the domain that has this listing
      const domain = selectedDomains.find((d) => d.listings?.some((l) => l.id === listing.id))
      return {
        id: listing.id,
        name: domain?.name ?? '',
        price: listing.price,
        currency: listing.currency_address,
        expires: listing.expires_at,
        source: listing.source,
      }
    })
    dispatch(setCancelListingModalListings(cancelListings))
    dispatch(setCancelListingModalOpen(true))
  }

  const handleCancel = () => {
    dispatch(clearBulkSelect())
  }

  const handleBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(true))
  }

  return (
    <div
      className={cn(
        'border-tertiary bg-background p-md md:px-lg absolute bottom-0 left-0 z-20 flex w-full flex-row items-center justify-end rounded-b-lg border-t-2 transition-transform duration-300 md:h-16 lg:justify-between starting:translate-y-full',
        selectedTab.value === 'domains' || (selectedTab.value === 'watchlist' && !cartIsEmpty) || filtersOpen
          ? selectedTab.value === 'domains' && (isMyProfile ? !isSelecting : cartIsEmpty) && !filtersOpen
            ? 'w-full translate-y-0 sm:translate-y-full lg:w-[300px] lg:translate-y-0'
            : 'w-full translate-y-0'
          : 'w-full translate-y-full lg:w-[300px] lg:translate-y-0'
      )}
    >
      <div className={cn('flex-row justify-end gap-2 lg:w-[284px]', filtersOpen ? 'flex' : 'hidden lg:flex')}>
        <PersistGate persistor={persistor}>
          <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
            Clear Filters
          </SecondaryButton>
          <SecondaryButton onClick={closeFilters} className='md:hidden'>
            Close Filters
          </SecondaryButton>
        </PersistGate>
      </div>
      <div className={cn('flex w-fit flex-row gap-x-2 overflow-x-scroll', filtersOpen ? 'hidden lg:flex' : 'flex')}>
        {selectedTab.value === 'domains' && isSelecting && (
          <>
            {/* <SecondaryButton onClick={handleSelectAll} disabled={visibleDomains.length === 0}>
              Select All
            </SecondaryButton> */}
            {isMyProfile && (
              <PrimaryButton onClick={handleListAction} disabled={selectedDomains.length === 0}>
                List
              </PrimaryButton>
            )}
            {isMyProfile && (
              <PrimaryButton onClick={handleCancelListingsAction} disabled={previousListings.length === 0}>
                <p className='text-nowrap'>Cancel ({previousListings.length})</p>
              </PrimaryButton>
            )}
            <PrimaryButton onClick={handleExtendAction} disabled={selectedDomains.length === 0}>
              Extend
            </PrimaryButton>
            {isMyProfile && (
              <PrimaryButton onClick={handleTransferAction} disabled={selectedDomains.length === 0}>
                Transfer
              </PrimaryButton>
            )}
            <SecondaryButton onClick={handleCancel} className='block px-2.5! sm:hidden'>
              <Cross className='h-4 w-4' />
            </SecondaryButton>
          </>
        )}
        {selectedTab.value === 'domains' && !isSelecting && (
          <SecondaryButton onClick={handleBulkSelect} className='block sm:hidden'>
            Bulk Select
          </SecondaryButton>
        )}
        {(isMyProfile ? selectedTab.value === 'watchlist' : selectedTab.value === 'domains') && !cartIsEmpty && (
          <>
            <SecondaryButton onClick={() => clearCart()}>Clear Cart</SecondaryButton>
            <PrimaryButton onClick={() => setIsCartOpen(true)}>Open Cart</PrimaryButton>
          </>
        )}
      </div>
    </div>
  )
}

export default ActionButtons
