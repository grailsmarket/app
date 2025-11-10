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
  const {
    denomination,
    setDenominationGenerator,
    priceRange,
    currMinVal,
    currMaxVal,
    setCurrMinVal,
    setCurrMaxVal,
    setMaxPrice,
    setMinPrice,
  } = usePriceRangeFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Price Range' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={142}
        label='Price Range'
        CustomComponent={
          <p className='text-md text-neutral font-medium'>
            {priceRange.min || priceRange.max ? `${priceRange.min || ''} - ${priceRange.max || ''}` : null}
          </p>
        }
      >
        <div className='px-lg py-md flex flex-col items-start gap-y-4'>
          <PriceDenominatorSwitch denomination={denomination} setDenominationGenerator={setDenominationGenerator} />
          <div className='flex gap-x-2'>
            <input
              type='number'
              className='border-primary/20 p-md text-md w-1/2 rounded-sm border-2 outline-none'
              placeholder='Min'
              value={currMinVal || ''}
              onChange={(e) => setCurrMinVal(Number(e.target.value))}
              onBlur={() => setMinPrice(Number(currMinVal))}
            />
            <input
              type='number'
              className='border-primary/20 p-md text-md w-1/2 rounded-sm border-2 outline-none'
              placeholder='Max'
              value={currMaxVal || ''}
              onChange={(e) => setCurrMaxVal(Number(e.target.value))}
              onBlur={() => setMaxPrice(Number(currMaxVal))}
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default PriceRangeFilter
