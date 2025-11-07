'use client'

import React from 'react'
import { FilterProvider } from '@/context/filters'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActionButtons from '@/app/marketplace/components/actionButtons'
import { useWindowSize } from 'ethereum-identity-kit'

interface Props {
  category: string
}

const MainPanel: React.FC<Props> = ({ category }) => {
  const { width: windowWidth } = useWindowSize()

  return (
    <FilterProvider filterType='category'>
      <div className='p-lg w-full z-10'>
        <div className='p-lg max-w-domain-panel mx-auto bg-background border-primary relative z-10 flex gap-4 rounded-lg border-2'>
          <FilterPanel />
          <div
            className='pt-lg flex flex-col gap-4'
            style={{
              width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
            }}
          >
            <DomainPanel category={category} />
          </div>
          <ActionButtons />
        </div>
      </div>
    </FilterProvider>
  )
}

export default MainPanel
