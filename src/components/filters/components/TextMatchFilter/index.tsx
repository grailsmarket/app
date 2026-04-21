'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTextMatchFilters } from './hooks/useTextMatchFilters'
import UnexpandedFilter from '../UnexpandedFilter'
import TextMatchFilterItem from './TextMatchFilterItem'
import { TEXT_MATCH_FILTER_LABELS } from '@/constants/filters/name'
import { TextMatchFilterLabel } from '@/types/filters/name'

const TextMatchFilter = () => {
  const { getValue, setValue } = useTextMatchFilters()
  const filterLabels = TEXT_MATCH_FILTER_LABELS
  const placeholders = ['...', '...', '...']

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Text Match' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='px-lg py-md flex flex-col gap-y-2'>
            {filterLabels.map((label, index) => (
              <TextMatchFilterItem
                key={label}
                label={label}
                placeholder={placeholders[index]}
                value={getValue(label as TextMatchFilterLabel)}
                onChange={(value) => setValue(label as TextMatchFilterLabel, value)}
              />
            ))}
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default TextMatchFilter
