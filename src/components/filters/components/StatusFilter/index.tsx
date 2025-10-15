'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useStatusFilters } from './hooks/useStatusFilters'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import { MARKETPLACE_STATUS_FILTER_LABELS } from '@/constants/filters/marketplaceFilters'

const StatusFilter: React.FC = () => {
  const { open, toggleOpen } = useFilterOpen('Status')
  const { isActive, toggleActive } = useStatusFilters()

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Status' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={236} label='Status'>
        <div className='pt-sm flex flex-col overflow-x-hidden'>
          {MARKETPLACE_STATUS_FILTER_LABELS.map((label, index) => (
            <div key={index} className='flex px-lg py-md cursor-pointer rounded-sm hover:bg-secondary justify-between' onClick={toggleActive(label)}>
              <p className='text-md text-light-200 font-medium'>{label}</p>
              <FilterSelector isActive={isActive(label)} onClick={toggleActive(label)} />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default StatusFilter
