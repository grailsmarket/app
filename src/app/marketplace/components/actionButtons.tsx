'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { persistor } from '@/state'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'

const ActionButtons = () => {
  const { open } = useAppSelector(selectMarketplaceFilters)
  const { isFiltersClear, clearFilters } = useFilterButtons()

  return (
    <div className='border-primary bg-background p-lg absolute right-0 bottom-0 z-20 flex w-full flex-row justify-end rounded-b-lg border-t-2 lg:justify-between'>
      <div className={cn('lg:w-[262px]', open ? 'block' : 'hidden flex-row justify-end lg:flex')}>
        <PersistGate persistor={persistor}>
          <SecondaryButton
            disabled={isFiltersClear}
            onClick={clearFilters}
          >
            Clear Filters
          </SecondaryButton>
        </PersistGate>
      </div>
      <div className={cn('flex flex-row w-fit gap-x-2', open ? 'hidden lg:flex' : 'flex')}>
        <SecondaryButton>
          Clear Cart
        </SecondaryButton>
        <PrimaryButton>
          Open Cart
        </PrimaryButton>
      </div>
    </div>
  )
}

export default ActionButtons
