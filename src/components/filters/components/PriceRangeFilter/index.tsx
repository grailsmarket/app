'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { usePriceRangeFilter } from './hooks/usePriceRangeFilter'
import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'

const PriceRangeFilter = () => {
  const { currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMaxPrice, setMinPrice } = usePriceRangeFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Price Range' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='px-lg py-md flex w-full flex-row items-center justify-between'>
            <p className='text-lg font-medium'>Price</p>
            {/* <PriceDenominatorSwitch denomination={denomination} setDenominationGenerator={setDenominationGenerator} /> */}
            <div className='flex w-2/3 flex-row gap-x-2'>
              <input
                type='text'
                inputMode='decimal'
                className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
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
                className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
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
        </div>
      </div>
    </PersistGate>
  )
}

export default PriceRangeFilter
