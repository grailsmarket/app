'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTextMatchFilters } from './hooks/useTextMatchFilters'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import TextMatchFilterItem from './TextMatchFilterItem'
import { TEXT_MATCH_FILTER_LABELS, TextMatchFilterLabel } from '@/constants/filters/marketplaceFilters'

const TextMatchFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Text Match')
  const { getValue, setValue } = useTextMatchFilters()
  const filterLabels = TEXT_MATCH_FILTER_LABELS
  const placeholders = ['Contains "..."', 'Starts with "..."', 'Ends with "..."']

  // Calculate expanded height based on number of labels (each input row is ~48px)
  const expandedHeight = 56 + filterLabels.length * 48

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Text Match' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Text Match'>
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
      </ExpandableTab>
    </PersistGate>
  )
}

export default TextMatchFilter
