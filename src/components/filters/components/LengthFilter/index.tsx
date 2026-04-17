'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useLengthFilter } from './hooks/useLengthFilter'
import UnexpandedFilter from '../UnexpandedFilter'
import { persistor } from '@/state'
import { useClickAway } from '@/hooks/useClickAway'
import { Ref } from 'react'

const LengthFilter = () => {
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
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
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
                className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
              />
              <input
                ref={onMaxClickAway as Ref<HTMLInputElement>}
                type='number'
                placeholder='Max'
                value={currMaxVal || ''}
                onBlur={() => setMaxLength(Number(maxVal))}
                onChange={(e) => setCurrMaxVal(Number(e.target.value))}
                className='border-primary/20 p-md w-1/2 rounded-sm border-2 text-lg outline-none'
              />
            </div>
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default LengthFilter
