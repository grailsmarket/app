'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
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
      <div className={cn('lg:w-[270px]', open ? 'block' : 'hidden flex-row justify-end lg:flex')}>
        <PersistGate persistor={persistor}>
          <button
            disabled={isFiltersClear}
            onClick={clearFilters}
            className='bg-tertiary p-md cursor-pointer rounded-sm text-lg font-bold transition-all hover:opacity-60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'
          >
            Clear Filters
          </button>
        </PersistGate>
      </div>
      <div className={cn('flex flex-row gap-x-2', open ? 'hidden lg:flex' : 'flex')}>
        <button className='bg-tertiary px-lg py-md cursor-pointer rounded-sm text-lg font-semibold transition-all hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'>
          Clear Cart
        </button>
        <button className='bg-primary text-background px-lg py-md cursor-pointer rounded-sm text-lg font-semibold transition-all hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100'>
          Open Cart
        </button>
      </div>
    </div>
  )
}

export default ActionButtons
