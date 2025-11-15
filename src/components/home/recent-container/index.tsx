'use client'

import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'
import { useWindowSize } from 'ethereum-identity-kit'

const RecentContainer = () => {
  const { width } = useWindowSize()

  return (
    <div className='bg-secondary w-full overflow-y-scroll lg:w-2/5'
      style={{
        height: width && width > 1024 ? 'calc(100vh - 70px)' : 'fit-content',
      }}
    >
      <div className='bg-secondary border-tertiary p-md shadow-medium flex h-full w-full flex-col justify-between gap-4 border-t-2 md:flex-row lg:flex-col xl:border-l'>
        <div className='w-full md:w-1/2 lg:w-full'>
          <SalesAndRegs />
        </div>
        <div className='w-full md:w-1/2 lg:w-full'>
          <RecentListings />
        </div>
      </div>
    </div>
  )
}

export default RecentContainer
