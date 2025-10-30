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
  const { clearFilters, isFiltersClear } = useFilterButtons()

  return (
    <div
      className={cn(
        'bg-background border-primary p-lg absolute bottom-0 left-0 z-50 w-full flex-row justify-end border-t-2 sm:w-[288px] lg:w-[300px] lg:rounded-tr-md lg:border-r-2',
        open ? 'flex' : 'hidden lg:flex'
      )}
    >
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
