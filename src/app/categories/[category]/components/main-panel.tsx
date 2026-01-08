'use client'

import React, { Suspense } from 'react'
import { FilterProvider } from '@/context/filters'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActivityPanel from './activity'
import TabSwitcher from './tabSwitcher'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppSelector } from '@/state/hooks'
import { selectCategory } from '@/state/reducers/category/category'

interface Props {
  category: string
}

const MainPanel: React.FC<Props> = ({ category }) => {
  const { selectedTab } = useAppSelector(selectCategory)

  return (
    <Suspense>
      <FilterProvider filterType='category' categoryTab={selectedTab}>
        <div className='border-tertiary z-10 w-full border-t-2'>
          <TabSwitcher category={category} />
          <div className='bg-background relative z-10 mx-auto flex min-h-[calc(100dvh-56px)] gap-0 md:min-h-[calc(100dvh-70px)]'>
            <FilterPanel />
            <CategoryContent category={category} />
            <ActionButtons />
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
