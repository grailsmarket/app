'use client'

import React from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { selectFilterPanel } from '@/state/reducers/filterPanel'
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'
import CategoriesFilterPanel from '../CategoriesFilterPanel'
import CategoriesPanel from '../CategoriesPanel'
import CategoriesPageTabSwitcher from '../tabSwitcher'
import CategoriesPageDomainsPanel from '../domainsPanel'
import FilterPanel from '@/components/filters'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useFilterUrlSync } from '@/hooks/filters/useFilterUrlSync'

const MainPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const filterPanel = useAppSelector(selectFilterPanel)
  const filtersOpen = filterPanel.open
  const { categoriesPage } = useAppSelector(selectCategoriesPage)
  const { selectedTab } = categoriesPage

  // Sync filters with URL
  useFilterUrlSync({ filterType: 'categoriesPage' })

  const showCategoriesPanel = selectedTab.value === 'categories'
  const showDomainsPanel =
    selectedTab.value === 'names' || selectedTab.value === 'premium' || selectedTab.value === 'available'

  // On mobile: always 100%, on desktop: adjust based on filter open state
  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-0'>
      <CategoriesPageTabSwitcher />
      <div className='flex w-full flex-row gap-0'>
        {showCategoriesPanel && <CategoriesFilterPanel />}
        {showDomainsPanel && <FilterPanel />}
        <div className='flex w-full flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
          {showCategoriesPanel && <CategoriesPanel />}
          {showDomainsPanel && <CategoriesPageDomainsPanel />}
        </div>
      </div>
      {showDomainsPanel && <ActionButtons />}
    </div>
  )
}

export default MainPanel
