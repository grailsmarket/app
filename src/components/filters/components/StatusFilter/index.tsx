'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useStatusFilters } from './hooks/useStatusFilters'
import { persistor } from '@/state'
import FilterDropdown from '../FilterDropdown'
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
  const { getStatus, setStatus } = useStatusFilters()
  const { filterType, profileTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'

  // Determine which labels to use based on context
  const filterLabels = useMemo(() => {
    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return MY_DOMAINS_FILTER_LABELS
      } else if (activeProfileTab === 'listings') {
        return []
      } else if (activeProfileTab === 'expired') {
        return [] // Status is fixed to Premium/Available for expired tab
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

  // Create options with 'none' prepended
  const options = useMemo(() => ['none', ...filterLabels] as const, [filterLabels])

  // Create option labels mapping (each label maps to itself, 'none' maps to '---')
  const optionLabels = useMemo(() => {
    const labels: Record<string, string> = { none: '---' }
    filterLabels.forEach((label) => {
      labels[label] = label
    })
    return labels
  }, [filterLabels])

  // Calculate expanded height for one dropdown row
  const expandedHeight = 64 + 42

  if (filterLabels.length === 0) return null

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Status' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Status'>
        <div className='flex flex-col'>
          <FilterDropdown<string>
            label='Status'
            value={getStatus()}
            options={options}
            optionLabels={optionLabels}
            onChange={setStatus}
            noneValue='none'
          />
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default StatusFilter
