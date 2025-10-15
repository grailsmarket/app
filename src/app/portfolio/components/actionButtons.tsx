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
    <div className={cn('lg:w-[310px] w-full sm:w-[288px] bg-background border-t-2 border-primary lg:rounded-tr-md lg:border-r-2 absolute bottom-0 left-0 p-lg z-50 flex-row justify-end', open ? 'flex' : 'hidden lg:flex')}>
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
  )
}

export default ActionButtons