'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { MinOrMax, usePriceRangeFilter } from './hooks/usePriceRangeFilter'

import { persistor } from '../../../../../state/index'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/app/ui/ExpandableTab'
import PriceDenominatorSwitch from './components/PriceDenominatorSwitch'

const PriceRangeFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Price Range')
  const { priceRange, onChangeGenerator } = usePriceRangeFilter()

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
              className=" w-[121px] rounded border-none bg-dark-300  py-[11px] pl-4 pr-3 text-xs  font-medium leading-[18px] outline-none placeholder:text-light-500"
              placeholder="Min"
              value={priceRange.min}
              onChange={onChangeGenerator(MinOrMax.min)}
            />
            <input
              type="number"
              className=" w-[121px] rounded border-none bg-dark-300  py-[11px] pl-4 pr-3 text-xs font-medium leading-[18px] outline-none placeholder:text-light-500"
              placeholder="Max"
              value={priceRange.max}
              onChange={onChangeGenerator(MinOrMax.max)}
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default PriceRangeFilter
