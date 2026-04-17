'use client'

import { useMemo } from 'react'
import { PersistGate } from 'redux-persist/integration/react'
import { persistor } from '@/state'
import { useMarketFilters } from './hooks/useMarketFilters'
import UnexpandedFilter from '../UnexpandedFilter'
import FilterDropdown from '../FilterDropdown'
import {
  LISTED_FILTER_LABELS,
  MARKET_FILTER_LABELS,
  MARKET_FILTER_OPTIONS,
  MARKET_FILTER_OPTION_LABELS,
  OFFERS_FILTER_LABELS,
  MARKETPLACE_OPTIONS,
  MARKETPLACE_OPTION_LABELS,
  GRACE_FILTER_LABELS,
} from '@/constants/filters/name'
import { useFilterContext } from '@/context/filters'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketFilterLabel, MarketFilterOption, MarketplaceOption } from '@/types/filters/name'

const MarketFilter = () => {
  const { getOption, setOption, getMarketplaceOption, setMarketplaceOption } = useMarketFilters()
  const { filterType, profileTab, categoryTab } = useFilterContext()
  const { marketplaceTab, categoriesPageTab } = useFilterRouter()
  const activeProfileTab = profileTab?.value || 'domains'
  const activeCategoryTab = categoryTab?.value || 'names'
  const activeMarketplaceTab = marketplaceTab?.value || 'names'
  const activeCategoriesPageTab = categoriesPageTab?.value || 'categories'

  const filterLabels = useMemo(() => {
    if (filterType === 'category') {
      switch (activeCategoryTab) {
        case 'names':
          return MARKET_FILTER_LABELS
        case 'listings':
          return LISTED_FILTER_LABELS
        case 'premium':
          return GRACE_FILTER_LABELS
        case 'available':
          return GRACE_FILTER_LABELS
        default:
          return MARKET_FILTER_LABELS
      }
    }

    if (filterType === 'profile') {
      switch (activeProfileTab) {
        case 'listings':
          return LISTED_FILTER_LABELS
        case 'received_offers':
          return OFFERS_FILTER_LABELS
        case 'sent_offers':
          return OFFERS_FILTER_LABELS
        case 'grace':
          return GRACE_FILTER_LABELS
        case 'expired':
          return ['Has Last Sale'] as const
        default:
          return MARKET_FILTER_LABELS
      }
    }

    if (filterType === 'marketplace') {
      switch (activeMarketplaceTab) {
        case 'names':
          return MARKET_FILTER_LABELS
        case 'listings':
          return LISTED_FILTER_LABELS
        case 'premium':
          return GRACE_FILTER_LABELS
        case 'available':
          return GRACE_FILTER_LABELS
        default:
          return MARKET_FILTER_LABELS
      }
    }

    if (filterType === 'categoriesPage') {
      switch (activeCategoriesPageTab) {
        case 'names':
          return MARKET_FILTER_LABELS
        case 'listings':
          return LISTED_FILTER_LABELS
        case 'premium':
          return GRACE_FILTER_LABELS
        case 'available':
          return GRACE_FILTER_LABELS
        default:
          return MARKET_FILTER_LABELS
      }
    }

    return MARKET_FILTER_LABELS
  }, [filterType, activeProfileTab, activeCategoryTab, activeMarketplaceTab, activeCategoriesPageTab])

  const showMarketplaceDropdown = useMemo(() => {
    if (filterType === 'category') {
      switch (activeCategoryTab) {
        case 'names':
          return true
        case 'listings':
          return true
        case 'premium':
          return false
        case 'available':
          return false
        case 'activity':
          return false
        default:
          return true
      }
    }

    if (filterType === 'profile') {
      switch (activeProfileTab) {
        case 'domains':
          return true
        case 'grace':
          return false
        case 'expired':
          return false
        case 'listings':
          return true
        case 'received_offers':
          return true
        case 'sent_offers':
          return true
        case 'watchlist':
          return true
        case 'activity':
          return false
        default:
          return true
      }
    }

    if (filterType === 'marketplace') {
      switch (activeMarketplaceTab) {
        case 'names':
          return true
        case 'listings':
          return true
        case 'premium':
          return false
        case 'available':
          return false
        case 'activity':
          return false
        default:
          return true
      }
    }

    if (filterType === 'categoriesPage') {
      switch (activeCategoriesPageTab) {
        case 'names':
          return true
        case 'listings':
          return true
        case 'premium':
          return false
        case 'available':
          return false
        default:
          return true
      }
    }

    return true
  }, [filterType, activeCategoryTab, activeProfileTab, activeMarketplaceTab, activeCategoriesPageTab])

  return (
    <PersistGate persistor={persistor} loading={<UnexpandedFilter label='Market' />}>
      <div className='border-tertiary w-full border-b'>
        <div className='flex h-auto w-full flex-col py-1.5 transition-all'>
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
            {showMarketplaceDropdown && (
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
            )}
          </div>
        </div>
      </div>
    </PersistGate>
  )
}

export default MarketFilter
