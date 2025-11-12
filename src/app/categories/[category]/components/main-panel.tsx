'use client'

import React, { Suspense } from 'react'
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
    <Suspense>
      <FilterProvider filterType='category'>
        <div className='pt-lg md:p-lg z-10 w-full'>
          <div className='p-lg max-w-domain-panel border-tertiary bg-background md:border-primary relative z-10 mx-auto flex gap-4 border-t-2 md:rounded-lg md:border-2'>
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
    </Suspense>
  )
}

export default MainPanel
