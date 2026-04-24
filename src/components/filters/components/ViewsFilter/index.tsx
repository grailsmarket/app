'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useViewsFilter } from './hooks/useViewsFilter'
import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'

const ViewsFilter = () => {
  const { currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMinViews, setMaxViews } = useViewsFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Views' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='px-lg py-md flex w-full flex-row items-center justify-between'>
            <p className='text-lg font-medium'>Views</p>
            <div className='flex w-2/3 flex-row gap-x-2'>
              <input
                type='number'
                inputMode='numeric'
                className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
                placeholder='Min'
                value={currMinVal ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setCurrMinVal(val === '' ? null : Math.max(0, Math.floor(Number(val))))
                }}
                onBlur={(e) => {
                  const num = parseInt(e.target.value, 10)
                  setMinViews(isNaN(num) ? 0 : Math.max(0, num))
                }}
              />
              <input
                type='number'
                inputMode='numeric'
                className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
                placeholder='Max'
                value={currMaxVal ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  setCurrMaxVal(val === '' ? null : Math.max(0, Math.floor(Number(val))))
                }}
                onBlur={(e) => {
                  const num = parseInt(e.target.value, 10)
                  setMaxViews(isNaN(num) ? 0 : Math.max(0, num))
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default ViewsFilter
