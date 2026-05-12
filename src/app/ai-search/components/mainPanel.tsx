'use client'

import React from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { selectFilterPanel } from '@/state/reducers/filterPanel'
import TabSwitcher from './tabSwitcher'
import DomainPanel from './domainPanel'
import AiSearchHero from './aiSearchHero'
import FilterPanel from '@/components/filters'
import ActionButtons from '@/app/marketplace/components/actionButtons'

const MainPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { open: filtersOpen } = useAppSelector(selectFilterPanel)

  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-0'>
      <AiSearchHero />
      <TabSwitcher />
      <div className='flex w-full flex-row gap-0'>
        <FilterPanel />
        <div className='flex w-full flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
          <DomainPanel />
        </div>
      </div>
      <ActionButtons hideDomainActions={false} />
    </div>
  )
}

export default MainPanel
