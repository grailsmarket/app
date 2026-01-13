'use client'

import React, { Suspense, useEffect } from 'react'
import { FilterProvider } from '@/context/filters'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActivityPanel from './activity'
import TabSwitcher from './tabSwitcher'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { changeCategoryTab, selectCategory, setLastVisitedCategory } from '@/state/reducers/category/category'
import { clearFilters as clearCategoryDomainsFilters } from '@/state/reducers/filters/categoryDomainsFilters'
import { clearFilters as clearCategoryPremiumFilters } from '@/state/reducers/filters/categoryPremiumFilters'
import { clearFilters as clearCategoryAvailableFilters } from '@/state/reducers/filters/categoryAvailableFilters'
import { CATEGORY_TABS } from '@/constants/domains/category/tabs'

interface Props {
  category: string
}

const MainPanel: React.FC<Props> = ({ category }) => {
  const dispatch = useAppDispatch()
  const { selectedTab, lastVisitedCategory } = useAppSelector(selectCategory)

  useEffect(() => {
    if (lastVisitedCategory && lastVisitedCategory !== category) {
      dispatch(clearCategoryDomainsFilters())
      dispatch(clearCategoryPremiumFilters())
      dispatch(clearCategoryAvailableFilters())
      dispatch(changeCategoryTab(CATEGORY_TABS[0]))
    }

    dispatch(setLastVisitedCategory(category))
  }, [lastVisitedCategory, category, dispatch])

  return (
    <Suspense>
      <FilterProvider filterType='category' categoryTab={selectedTab}>
        <div className='border-tertiary z-10 w-full border-t-2'>
          <TabSwitcher category={category} />
          <div className='bg-background z-10 mx-auto flex min-h-[calc(100dvh-56px)] gap-0 md:min-h-[calc(100dvh-70px)]'>
            <FilterPanel />
            <CategoryContent category={category} />
            <ActionButtons hideDomainActions={selectedTab.value !== 'names'} />
          </div>
        </div>
      </FilterProvider>
    </Suspense>
  )
}

// Inner component to access filter state from context
interface CategoryContentProps {
  category: string
}

const CategoryContent: React.FC<CategoryContentProps> = ({ category }) => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const { selectors, categoryTab } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  const renderContent = () => {
    const activeTab = categoryTab?.value || 'names'

    if (activeTab === 'activity') {
      return <ActivityPanel category={category} />
    }

    // Names, Premium, and Available all use the DomainPanel
    // The filter state is automatically handled by useFilterRouter based on the active tab
    return <DomainPanel category={category} />
  }

  return (
    <div className='z-0 flex flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
      {renderContent()}
    </div>
  )
}

export default MainPanel
