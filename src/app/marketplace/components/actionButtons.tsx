'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useUserContext } from '@/context/user'
import useCartDomains from '@/hooks/useCartDomains'
import { persistor } from '@/state'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

interface ActionButtonsProps {
  hideDomainActions?: boolean
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ hideDomainActions }) => {
  const { selectors } = useFilterRouter()
  const { clearCart, cartIsEmpty, modifyingCartTokenIds } = useCartDomains()
  const { setIsCartOpen } = useUserContext()
  const { clearFilters, isFiltersClear, closeFilters } = useFilterButtons()
  const filtersOpen = selectors.filters.open

  return (
    <div
      className={cn(
        'border-tertiary bg-background h-16 items-center absolute right-0 bottom-0 z-30 flex w-full flex-row justify-end rounded-b-lg border-t-2 transition-transform duration-300 lg:justify-between starting:translate-y-full',
        ((cartIsEmpty && modifyingCartTokenIds.length === 0) || hideDomainActions) && !filtersOpen
          ? 'translate-y-full'
          : 'translate-y-0'
      )}
    >
      <div className={cn('flex-row justify-end px-lg gap-2 h-full lg:border-tertiary lg:pr-lg items-center lg:w-[298px]', filtersOpen ? 'flex' : 'hidden lg:flex')}>
        <PersistGate persistor={persistor}>
          <SecondaryButton disabled={isFiltersClear} onClick={clearFilters}>
            Clear Filters
          </SecondaryButton>
          <SecondaryButton onClick={closeFilters} className='md:hidden'>
            Close Filters
          </SecondaryButton>
        </PersistGate>
      </div>
      <div className={cn('flex w-fit px-lg flex-row gap-x-2', filtersOpen ? 'hidden lg:flex' : 'flex')}>
        <SecondaryButton onClick={clearCart} disabled={cartIsEmpty}>
          Clear Cart
        </SecondaryButton>
        <PrimaryButton onClick={() => setIsCartOpen(true)}>Open Cart</PrimaryButton>
      </div>
    </div>
  )
}

export default ActionButtons
