'use client'

import React, { useState } from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import TabSwitcher from './tabSwitcher'
import DomainPanel from './domainPanel'
import ActivityPanel from './activityPanel'
import FilterPanel from '@/components/filters'

const MainPanel: React.FC = () => {
  const [isLiveActivityConnected, setIsLiveActivityConnected] = useState(false)
  const isClient = useIsClient()
  const { selectedTab } = useAppSelector(selectMarketplace)
  const { width: windowWidth } = useWindowSize()
  const { open: filtersOpen } = useAppSelector(selectMarketplaceFilters)

  const showNamesPanel = selectedTab.value === 'names'
  const showActivityPanel = selectedTab.value === 'activity'

  // On mobile: always 100%, on desktop: adjust based on filter open state
  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-0'>
      <TabSwitcher isLiveActivityConnected={false} />
      <div className='flex flex-row gap-0 w-full'>
        <FilterPanel hasTabs={true} />
        <div
          className='flex w-full flex-col transition-all duration-300'
          style={{ width: getContentWidth() }}
        >
          {showNamesPanel && <DomainPanel />}
          {showActivityPanel && (
            <ActivityPanel
              isLiveActivityConnected={isLiveActivityConnected}
              setIsLiveActivityConnected={setIsLiveActivityConnected}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default MainPanel
