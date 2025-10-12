import React from 'react'
import RecentListings from './listings'
import SalesAndRegs from './salesAndRegs'

const RecentContainer = () => {
  return (
    <div className='bg-background rounded-md p-xl border-primary border-2 shadow-medium h-fit w-full flex flex-row gap-4'>
      <div className='w-1/2'><RecentListings /></div>
      <div className='w-1/2'><SalesAndRegs /></div>
    </div>
  )
}

export default RecentContainer