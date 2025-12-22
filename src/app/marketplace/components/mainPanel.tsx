'use client'

import React from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import TabSwitcher from './tabSwitcher'
import DomainPanel from './domainPanel'
import ActivityPanel from './activityPanel'

const MainPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { selectedTab } = useAppSelector(selectMarketplace)

  const showNamesPanel = selectedTab.value === 'names'
  const showActivityPanel = selectedTab.value === 'activity'

  return (
    <div
      className='flex w-full flex-col'
      style={{
        width: isClient ? (windowWidth ? (windowWidth < 1024 ? '100%' : 'calc(100% - 280px)') : '100%') : '100%',
      }}
    >
      <TabSwitcher />
      {showNamesPanel && <DomainPanel />}
      {showActivityPanel && <ActivityPanel />}
    </div>
  )
}

export default MainPanel
