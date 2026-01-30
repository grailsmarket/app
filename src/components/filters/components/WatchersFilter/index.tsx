'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useWatchersFilter } from './hooks/useWatchersFilter'

import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'

const WatchersFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Watchers')
  const { watchersCount, currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMinWatchers, setMaxWatchers } =
    useWatchersFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Watchers' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={112}
        label='Watchers'
        CustomComponent={
          <p className='text-md text-neutral font-medium'>
            {watchersCount?.min || watchersCount?.max
              ? `${watchersCount.min || ''} - ${watchersCount.max || ''}`
              : null}
          </p>
        }
      >
        <div className='px-lg py-md flex w-full flex-row items-center justify-between'>
          <p className='text-lg font-medium'>Watchers</p>
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
      </ExpandableTab>
    </PersistGate>
  )
}

export default WatchersFilter
