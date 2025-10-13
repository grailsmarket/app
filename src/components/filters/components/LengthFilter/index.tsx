'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useLengthFilter } from './hooks/useLengthFilter'
import { useFilterOpen } from '../../hooks/useFilterOpen'

import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'
import { persistor } from '@/state'

const LengthFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Length')
  const { minVal, maxVal, setMinLength, setMaxLength } = useLengthFilter()

  return (
    <PersistGate
      persistor={persistor}
      loading={<UnexpandedFilter label="Length" />}
    >
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        label="Length"
        expandedHeight={84}
      >
        <div className="flex flex-row gap-x-2">
          <input
            type="number"
            placeholder="Min"
            value={minVal || ''}
            onChange={(e) => setMinLength(Number(e.target.value))}
            className='w-1/2 outline-none border-primary/20 border-2 p-md rounded-sm text-md'
          />
          <input
            type="number"
            placeholder="Max"
            value={maxVal || ''}
            onChange={(e) => setMaxLength(Number(e.target.value))}
            className='w-1/2 outline-none border-primary/20 border-2 p-md rounded-sm text-md'
          />
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default LengthFilter
