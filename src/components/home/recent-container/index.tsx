import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='mf:flex-row flex w-full flex-col items-center justify-center gap-4 md:flex-row'>
      <div className='bg-secondary p-md border-tertiary w-full rounded-md border md:w-1/2'>
        <SalesAndRegs />
      </div>
      <div className='bg-secondary p-md border-tertiary w-full rounded-md border md:w-1/2'>
        <RecentListings />
      </div>
    </div>
  )
}

export default RecentContainer
