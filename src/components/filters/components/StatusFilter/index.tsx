'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useStatusFilters } from './hooks/useStatusFilters'
import { persistor } from '@/state'
import FilterDropdown from '../FilterDropdown'
import UnexpandedFilter from '../UnexpandedFilter'
import { NAME_STATUS_FILTER_LABELS, MY_NAMES_FILTER_LABELS } from '@/constants/filters/name'
import { useFilterContext } from '@/context/filters'
import { useMemo } from 'react'
import { OFFERS_STATUS_FILTER_LABELS } from '@/constants/filters/offers'
import { ACTIVITY_TYPE_FILTERS_LABELS } from '@/constants/filters/activity'

const StatusFilter: React.FC = () => {
  const { getStatus, setStatus } = useStatusFilters()
  const { filterType, profileTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'

  // Determine which labels to use based on context
  const filterLabels = useMemo(() => {
    if (filterType === 'profile') {
      switch (activeProfileTab) {
        case 'domains':
          return MY_NAMES_FILTER_LABELS
        case 'listings':
          return []
        case 'expired':
          return []
        case 'received_offers':
          return OFFERS_STATUS_FILTER_LABELS
        case 'sent_offers':
          return OFFERS_STATUS_FILTER_LABELS
        case 'watchlist':
          return NAME_STATUS_FILTER_LABELS
        case 'activity':
          return ACTIVITY_TYPE_FILTERS_LABELS
        default:
          return MY_NAMES_FILTER_LABELS
      }
    }

    return NAME_STATUS_FILTER_LABELS
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

  if (filterLabels.length === 0) return null

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Status' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
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
        </div>
      </div>
    </PersistGate>
  )
}

export default StatusFilter
