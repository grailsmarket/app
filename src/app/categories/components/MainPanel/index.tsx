'use client'

import React, { useEffect } from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectFilterPanel } from '@/state/reducers/filterPanel'
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'
import CategoriesFilterPanel from '../CategoriesFilterPanel'
import CategoriesPanel from '../CategoriesPanel'
import CategoriesPageTabSwitcher from '../tabSwitcher'
import CategoriesPageDomainsPanel from '../domainsPanel'
import AllHoldersPanel from '../allHoldersPanel'
import FilterPanel from '@/components/filters'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useFilterUrlSync } from '@/hooks/filters/useFilterUrlSync'
import { setViewType } from '@/state/reducers/view'
import ActivityPanel from '../activity'
import { useCategoriesPageDomains } from '../../hooks/useCategoriesPageDomains'
import { useAllHolders } from '../../hooks/useAllHolders'

const MainPanel: React.FC = () => {
  const dispatch = useAppDispatch()
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const filterPanel = useAppSelector(selectFilterPanel)
  const filtersOpen = filterPanel.open
  const { categoriesPage } = useAppSelector(selectCategoriesPage)
  const { selectedTab } = categoriesPage

  // Default to list view on the categories page
  useEffect(() => {
    dispatch(setViewType('list'))
  }, [])

  // Sync filters with URL
  useFilterUrlSync({ filterType: 'categoriesPage' })

  const showCategoriesPanel = selectedTab.value === 'categories'
  const showDomainsPanel =
    selectedTab.value === 'names' ||
    selectedTab.value === 'listings' ||
    selectedTab.value === 'premium' ||
    selectedTab.value === 'available'
  const showHoldersPanel = selectedTab.value === 'holders'
  const showActivityPanel = selectedTab.value === 'activity'
  const categoriesPageDomains = useCategoriesPageDomains()
  const allHolders = useAllHolders(showHoldersPanel)

  // On mobile: always 100%, on desktop: adjust based on filter open state
  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    // Holders panel has no filter panel, always full width
    if (showHoldersPanel) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-0'>
      <CategoriesPageTabSwitcher
        activeListingsTotal={categoriesPageDomains.totalDomains}
        activeHoldersTotal={allHolders.totalHolders}
      />
      <div className='flex w-full flex-row gap-0'>
        {showCategoriesPanel && <CategoriesFilterPanel />}
        {(showDomainsPanel || showActivityPanel) && <FilterPanel />}
        <div className='z-0 flex w-full flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
          {showCategoriesPanel && <CategoriesPanel />}
          {showDomainsPanel && <CategoriesPageDomainsPanel {...categoriesPageDomains} />}
          {showHoldersPanel && <AllHoldersPanel {...allHolders} />}
          {showActivityPanel && <ActivityPanel />}
        </div>
      </div>
      {showDomainsPanel && <ActionButtons />}
    </div>
  )
}

export default MainPanel
