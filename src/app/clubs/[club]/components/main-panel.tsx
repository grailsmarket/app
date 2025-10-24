'use client'

import React from 'react'
import { FilterProvider } from '@/context/filters'
import FilterPanel from '@/components/filters'
import DomainPanel from './domains'
import ActionButtons from '@/app/portfolio/components/actionButtons'
import { useWindowSize } from 'ethereum-identity-kit'

interface Props {
  club: string
}

const MainPanel: React.FC<Props> = ({ club }) => {
  const { width: windowWidth } = useWindowSize()

  return (
    <FilterProvider filterType='club'>
      <div className='p-lg z-50'>
        <div className='p-lg bg-background border-primary relative z-10 flex gap-4 rounded-lg border-2'>
          <FilterPanel />
          <div
            className='pt-lg flex flex-col gap-4'
            style={{
              width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
            }}
          >
            <DomainPanel club={club} />
          </div>
          <ActionButtons />
        </div>
      </div>
    </FilterProvider>
  )
}

export default MainPanel
