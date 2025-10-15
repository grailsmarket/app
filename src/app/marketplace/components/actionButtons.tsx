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
    <div className='flex z-20 flex-row lg:justify-between justify-end absolute bottom-0 border-t-2 border-primary rounded-b-lg right-0 bg-background w-full p-lg'>
      <div className={cn('lg:w-[270px]', open ? 'block' : 'hidden lg:flex flex-row justify-end')}>
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
        <button className='bg-tertiary rounded-sm px-lg py-md text-lg cursor-pointer font-semibold hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all'>Clear Cart</button>
        <button className='bg-primary text-background rounded-sm px-lg py-md text-lg cursor-pointer font-semibold hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 transition-all'>Open Cart</button>
      </div>
    </div>
  )
}

export default ActionButtons