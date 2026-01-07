'use client'

import { useMemo } from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useMarketFilters } from './hooks/useMarketFilters'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import ExpandableTab from '@/components/ui/expandableTab'
import UnexpandedFilter from '../UnexpandedFilter'
import FilterDropdown from '../FilterDropdown'
import {
  LISTED_FILTER_LABELS,
  MARKET_FILTER_LABELS,
  MARKET_FILTER_OPTIONS,
  MARKET_FILTER_OPTION_LABELS,
  MarketFilterLabel,
  MarketFilterOption,
  OFFERS_FILTER_LABELS,
  MARKETPLACE_OPTIONS,
  MARKETPLACE_OPTION_LABELS,
  MarketplaceOption,
} from '@/constants/filters/marketplaceFilters'
import { useFilterContext } from '@/context/filters'

const MarketFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Market')
  const { getOption, setOption, getMarketplaceOption, setMarketplaceOption } = useMarketFilters()
  const { filterType, profileTab } = useFilterContext()
  const activeProfileTab = profileTab?.value || 'domains'

  const filterLabels = useMemo(() => {
    if (filterType === 'profile') {
      if (activeProfileTab === 'listings') {
        return LISTED_FILTER_LABELS
      } else if (activeProfileTab === 'received_offers') {
        return OFFERS_FILTER_LABELS
      } else if (activeProfileTab === 'sent_offers') {
        return OFFERS_FILTER_LABELS
      }
    }

    return MARKET_FILTER_LABELS
  }, [filterType, activeProfileTab])

  // Calculate expanded height based on number of labels + 1 for marketplace dropdown
  const expandedHeight = 64 + (filterLabels.length + 1) * 42

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Market' />}>
      <ExpandableTab open={open} toggleOpen={toggleOpen} expandedHeight={expandedHeight} label='Market'>
        <div className='flex flex-col'>
          {filterLabels.map((label) => (
            <div key={label}>
              <FilterDropdown<MarketFilterOption>
                label={label}
                value={getOption(label as MarketFilterLabel)}
                options={MARKET_FILTER_OPTIONS}
                optionLabels={MARKET_FILTER_OPTION_LABELS}
                onChange={(option) => setOption(label as MarketFilterLabel, option)}
                noneValue='none'
              />
            </div>
          ))}
          <div>
            <FilterDropdown<MarketplaceOption>
              label='Marketplace'
              value={getMarketplaceOption()}
              options={MARKETPLACE_OPTIONS}
              optionLabels={MARKETPLACE_OPTION_LABELS}
              onChange={(option) => setMarketplaceOption(option)}
              noneValue='none'
            />
          </div>
        </div>
      </ExpandableTab>
    </PersistGate>
  )
}

export default MarketFilter
