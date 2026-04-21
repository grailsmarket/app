'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTextNonMatchFilters } from './hooks/useTextNonMatchFilters'
import UnexpandedFilter from '../UnexpandedFilter'
import TextMatchFilterItem from '../TextMatchFilter/TextMatchFilterItem'
import { TEXT_NON_MATCH_FILTER_LABELS } from '@/constants/filters/name'
import { TextNonMatchFilterLabel } from '@/types/filters/name'

const TextNonMatchFilter = () => {
  const { getValue, setValue } = useTextNonMatchFilters()
  const filterLabels = TEXT_NON_MATCH_FILTER_LABELS
  const placeholders = ['...', '...', '...']

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Text Non-Match' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
          <div className='px-lg py-md flex flex-col gap-y-2'>
            {filterLabels.map((label, index) => (
              <TextMatchFilterItem
                key={label}
                label={label}
                placeholder={placeholders[index]}
                value={getValue(label as TextNonMatchFilterLabel)}
                onChange={(value) => setValue(label as TextNonMatchFilterLabel, value)}
              />
            ))}
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default TextNonMatchFilter
