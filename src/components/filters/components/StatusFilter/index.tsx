'use client'

import { PersistGate } from 'redux-persist/integration/react'

import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useStatusFilters } from './hooks/useStatusFilters'

import { persistor } from '@/app/state'

import Switch from '@/app/ui/Switch'
import ExpandableTab from '@/app/ui/ExpandableTab'
import UnexpandedFilter from '../UnexpandedFilter'

import {
  ExclusiveStatusFilterType,
  MARKETPLACE_STATUS_FILTER_LABELS,
  OFFERS_STATUS_FILTER_LABELS,
  YOUR_DOMAINS_FILTER_LABELS,
} from '@/app/constants/filters/marketplaceFilters'

interface StatusFilterProps {
  exclusiveStatusFilter?: ExclusiveStatusFilterType
}

const StatusFilter: React.FC<StatusFilterProps> = ({
  exclusiveStatusFilter,
}) => {
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
        expandedHeight={!exclusiveStatusFilter ? 227 : 150}
        label="Status"
      >
        <div className="mb-4 h-px w-full bg-dark-500" />
        <div className="flex flex-col gap-y-4 overflow-x-hidden">
          {(exclusiveStatusFilter
            ? exclusiveStatusFilter === 'domains'
              ? YOUR_DOMAINS_FILTER_LABELS
              : OFFERS_STATUS_FILTER_LABELS
            : MARKETPLACE_STATUS_FILTER_LABELS
          ).map((label, index) => (
            <div key={index} className="flex justify-between">
              <p className="text-xs font-medium text-light-200">{label}</p>
              <Switch
                isActive={isActive(label)}
                onChange={toggleActive(label)}
              />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default StatusFilter
