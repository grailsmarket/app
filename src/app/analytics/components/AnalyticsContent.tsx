'use client'

import React from 'react'
import AnalyticsFilters from './AnalyticsFilters'
import TopListsSection from './TopListsSection'
import ChartsSection from './ChartsSection'

const AnalyticsContent: React.FC = () => {
  return (
    <div className='w-full'>
      <AnalyticsFilters />
      <TopListsSection />
      <ChartsSection />
    </div>
  )
}

export default AnalyticsContent
