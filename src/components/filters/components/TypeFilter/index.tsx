'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTypeFilters } from './hooks/useTypeFilters'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import FilterSelector from '../FilterSelector'

import { MARKETPLACE_TYPE_FILTER_LABELS } from '@/constants/filters/marketplaceFilters'

const TypeFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Type')
  const { isActive, toggleActiveGenerator } = useTypeFilters()
  const filterLabels = MARKETPLACE_TYPE_FILTER_LABELS

  // Calculate expanded height based on number of labels
  const expandedHeight = 56 + filterLabels.length * 36

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Type'>
        <div className='flex flex-col'>
          {filterLabels.map((label, index) => (
            <div
              key={index}
              onClick={() => toggleActiveGenerator(label)}
              className='px-lg py-md hover:bg-secondary flex cursor-pointer justify-between'
            >
              <p className='text-light-200 text-md font-medium'>{label}</p>
              <FilterSelector isActive={isActive(label)} onClick={() => toggleActiveGenerator(label)} />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default TypeFilter
