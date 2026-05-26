'use client'

import React from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { selectBulkSearchFilters } from '@/state/reducers/filters/bulkSearchFilters'
import TabSwitcher from './tabSwitcher'
import DomainPanel from './domainPanel'
import TextareaSection from './textareaSection'
import FilterPanel from '@/components/filters'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useBulkSearchDomains } from '../hooks/useBulkSearchDomains'

const MainPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { open: filtersOpen } = useAppSelector(selectBulkSearchFilters)
  const bulkSearchDomains = useBulkSearchDomains()

  // On mobile: always 100%, on desktop: adjust based on filter open state
  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-0'>
      <TextareaSection />
      <TabSwitcher activeTabTotal={bulkSearchDomains.total} />
      <div className='flex w-full flex-row gap-0'>
        <FilterPanel />
        <div className='flex w-full flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
          <DomainPanel {...bulkSearchDomains} />
        </div>
      </div>
      <ActionButtons hideDomainActions={false} />
    </div>
  )
}

export default MainPanel
