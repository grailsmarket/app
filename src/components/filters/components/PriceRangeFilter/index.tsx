'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { usePriceRangeFilter } from './hooks/usePriceRangeFilter'

import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'

const PriceRangeFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Price Range')
  const { priceRange, currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMaxPrice, setMinPrice } =
    usePriceRangeFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Price Range' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={102}
        label='Price Range'
        CustomComponent={
          <p className='text-md text-neutral font-medium'>
            {priceRange.min || priceRange.max ? `${priceRange.min || ''} - ${priceRange.max || ''}` : null}
          </p>
        }
      >
        <div className='px-lg py-md flex flex-col items-start gap-y-4'>
          {/* <PriceDenominatorSwitch denomination={denomination} setDenominationGenerator={setDenominationGenerator} /> */}
          <div className='flex gap-x-2'>
            <input
              type='text'
              inputMode='decimal'
              className='border-primary/20 p-md text-md w-1/2 rounded-sm border-2 outline-none'
              placeholder='Min'
              value={currMinVal ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                  setCurrMinVal(val === '' ? null : val)
                }
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value)
                setMinPrice(isNaN(num) ? 0 : num)
              }}
            />
            <input
              type='text'
              inputMode='decimal'
              className='border-primary/20 p-md text-md w-1/2 rounded-sm border-2 outline-none'
              placeholder='Max'
              value={currMaxVal ?? ''}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                  setCurrMaxVal(val === '' ? null : val)
                }
              }}
              onBlur={(e) => {
                const num = parseFloat(e.target.value)
                setMaxPrice(isNaN(num) ? 0 : num)
              }}
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default PriceRangeFilter
