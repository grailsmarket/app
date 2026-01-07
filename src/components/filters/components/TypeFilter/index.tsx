'use client'

import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useTypeFilters } from './hooks/useTypeFilters'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import TypeFilterDropdown from './TypeFilterDropdown'

import { MARKETPLACE_TYPE_FILTER_LABELS, MarketplaceTypeFilterLabel } from '@/constants/filters/marketplaceFilters'

const TypeFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Type')
  const { getOption, setOption } = useTypeFilters()
  const filterLabels = MARKETPLACE_TYPE_FILTER_LABELS

  // Calculate expanded height based on number of labels
  const expandedHeight = 64 + filterLabels.length * 42

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Type' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Type'>
        <div className='flex flex-col'>
          {filterLabels.map((label, index) => (
            <div key={label} className={`z-${filterLabels.length - index}`}>
              <TypeFilterDropdown
                label={label}
                value={getOption(label as MarketplaceTypeFilterLabel)}
                onChange={(option) => setOption(label as MarketplaceTypeFilterLabel, option)}
              />
            </div>
          ))}
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default TypeFilter
