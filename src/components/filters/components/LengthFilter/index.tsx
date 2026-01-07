'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useLengthFilter } from './hooks/useLengthFilter'
import { useFilterOpen } from '../../hooks/useFilterOpen'

import UnexpandedFilter from '../UnexpandedFilter'
import ExpandableTab from '@/components/ui/expandableTab'
import { persistor } from '@/state'
import { useClickAway } from '@/hooks/useClickAway'
import { Ref } from 'react'

const LengthFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Length')
  const { minVal, maxVal, currMinVal, currMaxVal, setCurrMinVal, setCurrMaxVal, setMinLength, setMaxLength } =
    useLengthFilter()

  const onMinClickAway = useClickAway(() => {
    setMinLength(Number(currMinVal))
  })
  const onMaxClickAway = useClickAway(() => {
    setMaxLength(Number(currMaxVal))
  })

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Length' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        label='Length'
        expandedHeight={112}
        CustomComponent={
          <p className='text-md text-neutral font-medium'>{minVal ? `${minVal} - ${maxVal || '10+'}` : null}</p>
        }
      >
        <div className='px-lg py-md flex w-full items-center justify-between'>
          <p className='text-lg font-medium'>Length</p>
          <div className='flex w-2/3 flex-row gap-x-2'>
            <input
              ref={onMinClickAway as Ref<HTMLInputElement>}
              type='number'
              placeholder='Min'
              value={currMinVal || ''}
              onBlur={() => setMinLength(Number(minVal))}
              onChange={(e) => setCurrMinVal(Number(e.target.value))}
              className='border-primary/20 p-md text-md w-1/2 rounded-sm border-2 outline-none'
            />
            <input
              ref={onMaxClickAway as Ref<HTMLInputElement>}
              type='number'
              placeholder='Max'
              value={currMaxVal || ''}
              onBlur={() => setMaxLength(Number(maxVal))}
              onChange={(e) => setCurrMaxVal(Number(e.target.value))}
              className='border-primary/20 p-md text-md w-1/2 rounded-sm border-2 outline-none'
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default LengthFilter
