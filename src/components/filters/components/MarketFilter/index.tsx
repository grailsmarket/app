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
  GRACE_FILTER_LABELS,
} from '@/constants/filters/marketplaceFilters'
import { useFilterContext } from '@/context/filters'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

const MarketFilter = () => {
  const { open, toggleOpen } = useFilterOpen('Market')
  const { getOption, setOption, getMarketplaceOption, setMarketplaceOption } = useMarketFilters()
  const { filterType, profileTab, categoryTab } = useFilterContext()
  const { marketplaceTab, categoriesPageTab } = useFilterRouter()
  const activeProfileTab = profileTab?.value || 'domains'
  const activeCategoryTab = categoryTab?.value || 'names'
  const activeMarketplaceTab = marketplaceTab?.value || 'names'
  const activeCategoriesPageTab = categoriesPageTab?.value || 'categories'

  const filterLabels = useMemo(() => {
    if (filterType === 'category') {
      if (activeCategoryTab === 'names') {
        return MARKET_FILTER_LABELS
      } else if (activeCategoryTab === 'listings') {
        return LISTED_FILTER_LABELS
      } else if (activeCategoryTab === 'premium') {
        return GRACE_FILTER_LABELS
      } else if (activeCategoryTab === 'available') {
        return GRACE_FILTER_LABELS
      }

      return MARKET_FILTER_LABELS
    }

    if (filterType === 'profile') {
      if (activeProfileTab === 'listings') {
        return LISTED_FILTER_LABELS
      } else if (activeProfileTab === 'received_offers') {
        return OFFERS_FILTER_LABELS
      } else if (activeProfileTab === 'sent_offers') {
        return OFFERS_FILTER_LABELS
      } else if (activeProfileTab === 'grace') {
        return GRACE_FILTER_LABELS
      } else if (activeProfileTab === 'expired') {
        return ['Has Last Sale'] as const // Only show Has Last Sale for expired tab
      }
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'names') {
        return MARKET_FILTER_LABELS
      } else if (activeMarketplaceTab === 'listings') {
        return LISTED_FILTER_LABELS
      } else if (activeMarketplaceTab === 'premium') {
        return GRACE_FILTER_LABELS
      } else if (activeMarketplaceTab === 'available') {
        return GRACE_FILTER_LABELS
      }
    }

    if (filterType === 'categoriesPage') {
      if (activeCategoriesPageTab === 'names') {
        return MARKET_FILTER_LABELS
      } else if (activeCategoriesPageTab === 'listings') {
        return LISTED_FILTER_LABELS
      } else if (activeCategoriesPageTab === 'premium') {
        return GRACE_FILTER_LABELS
      } else if (activeCategoriesPageTab === 'available') {
        return GRACE_FILTER_LABELS
      }
    }

    return MARKET_FILTER_LABELS
  }, [filterType, activeProfileTab, activeCategoryTab, activeMarketplaceTab, activeCategoriesPageTab])

  const showMarketplaceDropdown = useMemo(() => {
    if (filterType === 'category') {
      if (activeCategoryTab === 'names') {
        return true
      } else if (activeCategoryTab === 'listings') {
        return true
      } else if (activeCategoryTab === 'premium') {
        return false
      } else if (activeCategoryTab === 'available') {
        return false
      } else if (activeCategoryTab === 'activity') {
        return false
      }
      return true
    }

    if (filterType === 'profile') {
      if (activeProfileTab === 'domains') {
        return true
      }
      if (activeProfileTab === 'grace') {
        return false
      } else if (activeProfileTab === 'expired') {
        return false
      } else if (activeProfileTab === 'listings') {
        return true
      } else if (activeProfileTab === 'received_offers') {
        return true
      } else if (activeProfileTab === 'sent_offers') {
        return true
      } else if (activeProfileTab === 'watchlist') {
        return true
      } else if (activeProfileTab === 'activity') {
        return false
      }
      return true
    }

    if (filterType === 'marketplace') {
      if (activeMarketplaceTab === 'names') {
        return true
      } else if (activeMarketplaceTab === 'listings') {
        return true
      } else if (activeMarketplaceTab === 'premium') {
        return false
      } else if (activeMarketplaceTab === 'available') {
        return false
      } else if (activeMarketplaceTab === 'activity') {
        return false
      }
    }

    if (filterType === 'categoriesPage') {
      if (activeCategoriesPageTab === 'names') {
        return true
      } else if (activeCategoriesPageTab === 'listings') {
        return true
      } else if (activeCategoriesPageTab === 'premium') {
        return false
      } else if (activeCategoriesPageTab === 'available') {
        return false
      }
    }

    return true
  }, [filterType, activeCategoryTab, activeProfileTab, activeMarketplaceTab, activeCategoriesPageTab])

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
      </ExpandableTab>
    </PersistGate>
  )
}

export default MarketFilter
