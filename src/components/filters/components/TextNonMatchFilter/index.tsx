'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTextNonMatchFilters } from './hooks/useTextNonMatchFilters'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import TextMatchFilterItem from '../TextMatchFilter/TextMatchFilterItem'
import { TEXT_NON_MATCH_FILTER_LABELS, TextNonMatchFilterLabel } from '@/constants/filters/marketplaceFilters'

const TextNonMatchFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Text Non-Match')
  const { getValue, setValue } = useTextNonMatchFilters()
  const filterLabels = TEXT_NON_MATCH_FILTER_LABELS
  const placeholders = ['...', '...', '...']

  // Calculate expanded height based on number of labels (each input row is ~48px)
  const expandedHeight = 56 + filterLabels.length * 48

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Text Non-Match' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Text Non-Match'>
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
      </ExpandableTab>
    </PersistGate>
  )
}

export default TextNonMatchFilter
