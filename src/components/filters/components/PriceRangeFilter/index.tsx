'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { usePriceRangeFilter } from './hooks/usePriceRangeFilter'

import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'
import PriceDenominatorSwitch from './components/PriceDenominatorSwitch'

const PriceRangeFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Price Range')
  const { priceRange, setMaxPrice, setMinPrice } = usePriceRangeFilter()

  return (
    <PersistGate
      persistor={persistor}
      loading={<UnexpandedFilter label="Price Range" />}
    >
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={112}
        label="Price Range"
      >
        <div className="flex flex-col items-start gap-y-4">
          <PriceDenominatorSwitch />
          <div className="flex gap-x-2">
            <input
              type="number"
              className="w-1/2 outline-none border-primary/20 border-2 p-md rounded-sm text-md"
              placeholder="Min"
              value={priceRange.min || ''}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              type="number"
              className="w-1/2 outline-none border-primary/20 border-2 p-md rounded-sm text-md"
              placeholder="Max"
              value={priceRange.max || ''}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default PriceRangeFilter
