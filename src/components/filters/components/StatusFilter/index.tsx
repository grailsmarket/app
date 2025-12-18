'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useStatusFilters } from './hooks/useStatusFilters'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import { MARKETPLACE_STATUS_FILTER_LABELS } from '@/constants/filters/marketplaceFilters'
import {
  MY_DOMAINS_FILTER_LABELS,
  RECEIVED_OFFERS_STATUS_FILTER_LABELS,
  MY_OFFERS_STATUS_FILTER_LABELS,
  PROFILE_ACTIVITY_FILTER_LABELS,
} from '@/constants/filters/portfolioFilters'
import { useFilterContext } from '@/context/filters'
import { useMemo } from 'react'

const StatusFilter: React.FC = () => {
  const { open, toggleOpen } = useFilterOpen('Status')
  const { isActive, toggleActive, statusFilter } = useStatusFilters()
  const { filterType, profileTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'

  // Determine which labels to use based on context
  const filterLabels = useMemo(() => {
    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return MY_DOMAINS_FILTER_LABELS
      } else if (activeProfileTab === 'listings') {
        return []
      } else if (activeProfileTab === 'received_offers') {
        return RECEIVED_OFFERS_STATUS_FILTER_LABELS
      } else if (activeProfileTab === 'sent_offers') {
        return MY_OFFERS_STATUS_FILTER_LABELS
      } else if (activeProfileTab === 'watchlist') {
        return MARKETPLACE_STATUS_FILTER_LABELS
      } else if (activeProfileTab === 'activity') {
        return PROFILE_ACTIVITY_FILTER_LABELS
      }

      return MY_DOMAINS_FILTER_LABELS
    }

    return MARKETPLACE_STATUS_FILTER_LABELS
  }, [filterType, activeProfileTab])

  // Calculate expanded height based on number of labels
  const expandedHeight = 56 + filterLabels.length * 36

  const selectedLabel =
    statusFilter.length > 1 ? `${statusFilter[0]} +${statusFilter.length - 1}` : statusFilter[0] || null

  if (filterLabels.length === 0) return null

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Status' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={expandedHeight}
        label='Status'
        CustomComponent={<p className='text-md text-neutral font-medium'>{selectedLabel}</p>}
      >
        <div className='pt-sm flex flex-col overflow-x-hidden'>
          {filterLabels.map((label, index) => (
            <div
              key={index}
              className='px-lg py-md hover:bg-secondary flex cursor-pointer justify-between rounded-sm'
              onClick={toggleActive(label as any)}
            >
              <p className='text-md text-light-200 font-medium'>{label}</p>
              <FilterSelector isActive={isActive(label as any)} onClick={toggleActive(label as any)} />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default StatusFilter
