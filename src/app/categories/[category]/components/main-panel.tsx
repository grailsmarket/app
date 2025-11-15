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
        <div className='z-10 w-full'>
          <div
            className='px-md border-tertiary bg-background relative z-10 mx-auto flex gap-2 overflow-hidden border-t-2 h-[calc(100dvh-62px)] md:h-[calc(100dvh-78px)]'
          >
            <FilterPanel />
            <div className='bg-tertiary hidden h-full w-0.5 lg:block' />
            <div
              className='flex flex-col gap-3 md:gap-4'
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
