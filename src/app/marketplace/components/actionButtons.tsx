'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import useCartDomains from '@/hooks/useCartDomains'
import { persistor } from '@/state'
import { cn } from '@/utils/tailwind'
import React, { useEffect, useState } from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import Image from 'next/image'
import ArrowDown from 'public/icons/arrow-down.svg'

interface ActionButtonsProps {
  hideDomainActions?: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ hideDomainActions }) => {
  const { selectors } = useFilterRouter()
  const { clearCart, cartIsEmpty } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
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

  const isActionBarVisible = !((cartIsEmpty || hideDomainActions) && !filtersOpen)

  return (
    <>
      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={cn(
          'bg-secondary hover:bg-tertiary border-tertiary fixed right-2 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border-2 shadow-sm transition-all duration-300 md:right-4',
          showScrollTop ? 'opacity-100' : 'pointer-events-none opacity-0',
          isActionBarVisible ? 'bottom-16 md:bottom-18' : 'bottom-4 md:bottom-6'
        )}
        aria-label='Scroll to top'
      >
        <Image src={ArrowDown} alt='Scroll to top' width={14} height={14} className='rotate-180' />
      </button>

      <div
        className={cn(
          'border-tertiary bg-background fixed bottom-0 left-0 z-30 flex h-14 w-full flex-row items-center justify-end rounded-b-lg border-t-2 transition-transform duration-300 md:h-16 lg:justify-between starting:translate-y-full',
          !cartIsEmpty && !hideDomainActions
            ? 'w-full translate-y-0'
            : filtersOpen
              ? 'w-full translate-y-0 lg:w-[290px]'
              : 'hidden'
        )}
      >
        <div
          className={cn(
            'px-md md:px-lg lg:border-tertiary flex h-full flex-row items-center justify-end gap-2 lg:w-[290px]'
          )}
        >
          <PersistGate persistor={persistor}>
            {filtersOpen && (
              <>
                <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
                  Clear Filters
                </SecondaryButton>
                <SecondaryButton onClick={closeFilters} className='lg:hidden'>
                  Close Filters
                </SecondaryButton>
              </>
            )}
          </PersistGate>
        </div>
        {!cartIsEmpty && !hideDomainActions && (
          <div className={cn('px-md md:px-lg flex w-fit flex-row gap-x-2', filtersOpen ? 'hidden lg:flex' : 'flex')}>
            <SecondaryButton onClick={clearCart} disabled={cartIsEmpty}>
              Clear Cart
            </SecondaryButton>
            <PrimaryButton onClick={() => setIsCartOpen(true)}>Open Cart</PrimaryButton>
          </div>
        )}
      </div>
    </>
  )
}

export default ActionButtons
