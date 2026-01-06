'use client'

import React, { Suspense } from 'react'
import { FilterProvider } from '@/context/filters'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

interface Props {
  category: string
}

const MainPanel: React.FC<Props> = ({ category }) => {
  return (
    <Suspense>
      <FilterProvider filterType='category'>
        <div className='z-10 w-full'>
          <div className='px-sm md:px-md border-tertiary bg-background relative z-10 mx-auto flex min-h-[calc(100dvh-56px)] gap-0 border-t-2 sm:px-3 md:min-h-[calc(100dvh-70px)]'>
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
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open

  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div
      className='flex flex-col gap-2 transition-all duration-300 md:gap-4'
      style={{ width: getContentWidth() }}
    >
      <DomainPanel category={category} />
    </div>
  )
}

export default MainPanel
