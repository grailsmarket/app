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
    <PersistGate
      persistor={persistor}
      loading={<UnexpandedFilter label="Status" />}
    >
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={227}
        label="Status"
      >
        <div className="flex flex-col pt-sm gap-y-4 overflow-x-hidden">
          {MARKETPLACE_STATUS_FILTER_LABELS.map((label, index) => (
            <div key={index} className="flex justify-between cursor-pointer" onClick={() => toggleActive(label)}>
              <p className="text-md font-medium text-light-200">{label}</p>
              <FilterSelector
                isActive={isActive(label)}
                onClick={toggleActive(label)}
              />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default StatusFilter
