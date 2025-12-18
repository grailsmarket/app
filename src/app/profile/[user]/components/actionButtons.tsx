'use client'

import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { cn } from '@/utils/tailwind'
import { useAppSelector } from '@/state/hooks'
import { useUserContext } from '@/context/user'
import useCartDomains from '@/hooks/useCartDomains'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'

const ActionButtons = () => {
  const { cartIsEmpty, clearCart } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

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

  return (
    <div
      className={cn(
        'border-tertiary action-buttons-container max-w-app! bg-background p-md md:px-lg action-buttons-container fixed bottom-0 left-0 z-20 flex w-full flex-row items-center justify-end rounded-b-lg border-t-2 transition-transform duration-300 md:h-16 lg:justify-between starting:translate-y-full',
        (selectedTab.value === 'watchlist' && !cartIsEmpty) || filtersOpen
          ? 'w-full translate-y-0'
          : 'w-full translate-y-full lg:w-[300px] lg:translate-y-0'
      )}
      style={{
        maxWidth: 'calc(var(--max-width-app) - 4px)',
      }}
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
        {selectedTab.value === 'watchlist' && !cartIsEmpty && (
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
