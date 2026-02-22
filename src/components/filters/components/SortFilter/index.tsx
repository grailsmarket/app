'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useSortFilters } from './hooks/useSortFilters'
import { persistor } from '@/state'
import FilterSelector from '../FilterSelector'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import { MARKETPLACE_SORT_FILTERS, SORT_FILTER_LABELS } from '@/constants/filters/marketplaceFilters'
import { useFilterContext } from '@/context/filters'
import { useMemo } from 'react'
import { cn } from '@/utils/tailwind'

const SortFilter: React.FC = () => {
  const { open, toggleOpen } = useFilterOpen('Sort')
  const { isActive, toggleActive, sortFilter, hasOnlyOneCategory } = useSortFilters()
  const { filterType, profileTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'

  // Determine which labels to use based on context
  const filterLabels = useMemo(() => {
    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return MARKETPLACE_SORT_FILTERS
      } else if (activeProfileTab === 'received_offers') {
        return null
      } else if (activeProfileTab === 'sent_offers') {
        return null
      } else if (activeProfileTab === 'watchlist') {
        return MARKETPLACE_SORT_FILTERS
      } else if (activeProfileTab === 'activity') {
        return null
      }

      return MARKETPLACE_SORT_FILTERS
    }

    return MARKETPLACE_SORT_FILTERS
  }, [filterType, activeProfileTab])

  if (!filterLabels) return null

  // Calculate expanded height based on number of labels
  const expandedHeight = 56 + filterLabels.length * 36

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Sort' />}>
      <ExpandableTab
        open={open}
        toggleOpen={toggleOpen}
        expandedHeight={expandedHeight}
        label='Sort'
        CustomComponent={
          <p className='text-md text-neutral font-medium'>
            {sortFilter ? SORT_FILTER_LABELS[sortFilter as keyof typeof SORT_FILTER_LABELS] : null}
          </p>
        }
      >
        <div className='pt-sm flex flex-col overflow-x-hidden'>
          {filterLabels.map((label, index) => (
            <div
              key={index}
              className={cn(
                'px-lg py-md hover:bg-secondary flex cursor-pointer justify-between rounded-sm',
                label === 'Categories Ranking' && !hasOnlyOneCategory && 'pointer-events-none opacity-50'
              )}
              onClick={toggleActive(label as any)}
            >
              <p className='text-md text-light-200 font-medium'>
                {SORT_FILTER_LABELS[label as keyof typeof SORT_FILTER_LABELS]}
              </p>
              <FilterSelector isActive={isActive(label as any)} onClick={toggleActive(label as any)} isRadio={true} />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default SortFilter
