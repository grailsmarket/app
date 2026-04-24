'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useWatchersFilter } from './hooks/useWatchersFilter'
import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'

const WatchersFilter = () => {
  const { currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMinWatchers, setMaxWatchers } = useWatchersFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Watchers' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='px-lg py-md flex w-full flex-row items-center justify-between'>
            <p className='text-lg font-medium'>Watchlists</p>
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
                  setMinWatchers(isNaN(num) ? 0 : Math.max(0, num))
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
                  setMaxWatchers(isNaN(num) ? 0 : Math.max(0, num))
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default WatchersFilter
