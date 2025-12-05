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
  selectBulkSelect,
  setBulkSelectIsSelecting,
  setBulkSelectDomains,
  setBulkSelectPreviousListings,
  clearBulkSelect,
} from '@/state/reducers/modals/bulkSelectModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'

interface ActionButtonsProps {
  visibleDomains?: MarketplaceDomainType[]
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ visibleDomains = [] }) => {
  const dispatch = useAppDispatch()
  const { cartIsEmpty, clearCart } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { isSelecting, domains: selectedDomains, previousListings } = useAppSelector(selectBulkSelect)
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  const handleSelectAll = () => {
    dispatch(setBulkSelectDomains(visibleDomains))
    // Also collect previous listings from visible domains that have grails listings
    const allPreviousListings: DomainListingType[] = []
    visibleDomains.forEach((domain) => {
      const grailsListings = domain.listings?.filter((listing) => listing.source === 'grails') || []
      grailsListings.forEach((listing) => {
        if (!allPreviousListings.some((l) => l.id === listing.id)) {
          allPreviousListings.push(listing)
        }
      })
    })
    dispatch(setBulkSelectPreviousListings(allPreviousListings))
  }

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

  const handleCancel = () => {
    dispatch(clearBulkSelect())
  }

  const handleBulkSelect = () => {
    dispatch(setBulkSelectIsSelecting(true))
  }

  return (
    <div
      className={cn(
        'border-tertiary bg-background p-md md:p-lg absolute right-0 bottom-0 z-20 flex w-full flex-row justify-end rounded-b-lg border-t-2 transition-transform duration-300 lg:justify-between starting:translate-y-full',
        selectedTab.value === 'domains' || (selectedTab.value === 'watchlist' && !cartIsEmpty) || filtersOpen
          ? 'translate-y-0'
          : 'translate-y-full'
      )}
    >
      <div className={cn('flex-row justify-end gap-2 lg:w-[262px]', filtersOpen ? 'flex' : 'hidden lg:flex')}>
        <PersistGate persistor={persistor}>
          <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
            Clear Filters
          </SecondaryButton>
          <SecondaryButton onClick={closeFilters} className='md:hidden'>
            Close Filters
          </SecondaryButton>
        </PersistGate>
      </div>
      <div className={cn('flex w-fit flex-row gap-x-2', filtersOpen ? 'hidden lg:flex' : 'flex')}>
        {selectedTab.value === 'domains' && isSelecting && (
          <>
            <SecondaryButton onClick={handleSelectAll} disabled={visibleDomains.length === 0}>
              Select All
            </SecondaryButton>
            <PrimaryButton onClick={handleListAction} disabled={selectedDomains.length === 0}>
              List
            </PrimaryButton>
            <PrimaryButton onClick={handleExtendAction} disabled={selectedDomains.length === 0}>
              Extend
            </PrimaryButton>
            <PrimaryButton onClick={handleTransferAction} disabled={selectedDomains.length === 0}>
              Transfer
            </PrimaryButton>
            <SecondaryButton onClick={handleCancel}>Cancel</SecondaryButton>
          </>
        )}
        {selectedTab.value === 'domains' && !isSelecting && (
          <SecondaryButton onClick={handleBulkSelect}>Bulk Select</SecondaryButton>
        )}
        {selectedTab.value === 'watchlist' && (
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
