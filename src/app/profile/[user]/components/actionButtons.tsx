'use client'

import React, { useEffect, useState } from 'react'
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
import Image from 'next/image'
import ArrowDown from 'public/icons/arrow-down.svg'
import { selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'

const ActionButtons = () => {
  const { cartIsEmpty, clearCart } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isActionBarVisible = (selectedTab.value === 'watchlist' && !cartIsEmpty) || filtersOpen
  const isBulkListingActionButtonsVisible = selectedTab.value === 'listings' || selectedTab.value === 'domains'
  const isBulkSelecting = useAppSelector(selectBulkSelect).isSelecting

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
    <>
      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          'bg-secondary hover:bg-tertiary border-tertiary fixed right-2 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm transition-all duration-300 md:right-4',
          showScrollTop ? 'opacity-100' : 'pointer-events-none opacity-0',
          isActionBarVisible ? 'bottom-16 md:bottom-18' : 'bottom-4 md:bottom-6',
          isBulkListingActionButtonsVisible && 'bottom-16 md:right-5 md:bottom-22',
          isBulkSelecting && 'bottom-30 md:bottom-24'
        )}
        aria-label='Scroll to top'
      >
        <Image src={ArrowDown} alt='Scroll to top' width={14} height={14} className='rotate-180' />
      </button>

      <div
        className={cn(
          'border-tertiary action-buttons-container max-w-app! bg-background p-md md:px-lg action-buttons-container fixed bottom-0 left-0 z-20 flex w-full flex-row items-center justify-end rounded-b-lg border-t-2 transition-transform duration-300 md:h-16 lg:justify-between starting:translate-y-full',
          (selectedTab.value === 'watchlist' && !cartIsEmpty)
            ? 'w-full translate-y-0'
            : filtersOpen ? 'w-full translate-y-full lg:w-[290px] lg:translate-y-0' : 'hidden'
        )}
        style={{
          maxWidth: 'calc(var(--max-width-app) - 4px)',
        }}
      >
        <div className='flex flex-row justify-end gap-2 lg:w-[264px]'>
          <PersistGate persistor={persistor}>
            {filtersOpen &&
              <>
                <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
                  Clear Filters
                </SecondaryButton>
                <SecondaryButton onClick={closeFilters} className='md:hidden'>
                  Close Filters
                </SecondaryButton>
              </>
            }
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
    </>
  )
}

export default ActionButtons
