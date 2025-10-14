'use client'

import { useFilterButtons } from '@/components/filters/hooks/useFilterButtons'
import { persistor } from '@/state'
import React from 'react'
import { PersistGate } from 'redux-persist/integration/react'

const ActionButtons = () => {
  const { isFiltersClear, clearFilters } = useFilterButtons()

  return (
    <div className='flex z-20 flex-row justify-between absolute bottom-0 border-2 border-primary rounded-b-lg right-0 bg-background w-full p-lg gap-x-2'>
      <div className='flex flex-row gap-x-2 w-[270px]'>
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
      <div className='flex flex-row gap-x-2'>
        <button className='bg-tertiary rounded-sm px-lg py-md cursor-pointer font-semibold'>Clear Cart</button>
        <button className='bg-primary text-background rounded-sm px-lg py-md cursor-pointer font-semibold'>Open Cart</button>
      </div>
    </div>
  )
}

export default ActionButtons