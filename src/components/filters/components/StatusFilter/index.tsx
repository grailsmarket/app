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
} from '@/constants/filters/portfolioFilters'
import { useFilterContext } from '@/contexts/FilterContext'
import { useMemo } from 'react'

const StatusFilter: React.FC = () => {
  const { open, toggleOpen } = useFilterOpen('Status')
  const { isActive, toggleActive } = useStatusFilters()
  const { filterType, portfolioTab } = useFilterContext()

  // Determine which labels to use based on context
  const filterLabels = useMemo(() => {
    if (filterType === 'portfolio') {
      if (portfolioTab === 'domains') {
        return MY_DOMAINS_FILTER_LABELS
      } else if (portfolioTab === 'received_offers') {
        return RECEIVED_OFFERS_STATUS_FILTER_LABELS
      } else if (portfolioTab === 'my_offers') {
        return MY_OFFERS_STATUS_FILTER_LABELS
      } else if (portfolioTab === 'watchlist') {
        return MARKETPLACE_STATUS_FILTER_LABELS
      }

      return MY_DOMAINS_FILTER_LABELS
    }

    return MARKETPLACE_STATUS_FILTER_LABELS
  }, [filterType, portfolioTab])

  // Calculate expanded height based on number of labels
  const expandedHeight = 56 + filterLabels.length * 36

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Status' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Status'>
        <div className='pt-sm flex flex-col overflow-x-hidden'>
          {filterLabels.map((label, index) => (
            <div
              key={index}
              className='px-lg py-md hover:bg-secondary flex cursor-pointer justify-between rounded-sm'
              onClick={toggleActive(label as any)}
            >
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
