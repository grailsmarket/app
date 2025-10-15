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

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={156} label='Type'>
        <div className='flex flex-col'>
          {MARKETPLACE_TYPE_FILTER_LABELS.map((label, index) => (
            <div key={index} onClick={() => toggleActiveGenerator(label)} className='flex px-lg py-md justify-between cursor-pointer hover:bg-secondary'>
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
