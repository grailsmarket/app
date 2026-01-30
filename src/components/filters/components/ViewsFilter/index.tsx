'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useViewsFilter } from './hooks/useViewsFilter'

import { persistor } from '@/state'
import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'

const ViewsFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Views')
  const { viewCount, currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMinViews, setMaxViews } = useViewsFilter()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Views' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={112}
        label='Views'
        CustomComponent={
          <p className='text-md text-neutral font-medium'>
            {viewCount?.min || viewCount?.max ? `${viewCount.min || ''} - ${viewCount.max || ''}` : null}
          </p>
        }
      >
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
      </ExpandableTab>
    </PersistGate>
  )
}

export default ViewsFilter
