'use client'

import React from 'react'
import { useIsClient, useWindowSize } from 'ethereum-identity-kit'
import { useAppSelector } from '@/state/hooks'
import { selectFilterPanel } from '@/state/reducers/filterPanel'
import CategoriesFilterPanel from '../CategoriesFilterPanel'
import CategoriesPanel from '../CategoriesPanel'

const MainPanel: React.FC = () => {
  const isClient = useIsClient()
  const { width: windowWidth } = useWindowSize()
  const filterPanel = useAppSelector(selectFilterPanel)
  const filtersOpen = filterPanel.open

  // On mobile: always 100%, on desktop: adjust based on filter open state
  const getContentWidth = () => {
    if (!isClient || !windowWidth) return '100%'
    if (windowWidth < 1024) return '100%'
    return filtersOpen ? 'calc(100% - 290px)' : '100%'
  }

  return (
    <div className='flex w-full flex-col gap-0'>
      <div className='flex w-full flex-row gap-0'>
        <CategoriesFilterPanel />
        <div className='flex w-full flex-col transition-all duration-300' style={{ width: getContentWidth() }}>
          <CategoriesPanel />
        </div>
      </div>
    </div>
  )
}

export default MainPanel
