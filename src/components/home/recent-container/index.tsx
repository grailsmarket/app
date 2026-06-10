import React from 'react'
import Registrations from './registrations'
import Sales from './sales'
import Premium from './premium'
import AnimateIn from '@/components/ui/animateIn'

const RecentContainer = () => {
  return (
    <div className='flex w-full flex-row flex-wrap items-center justify-center gap-4 @[80rem]/app:flex-nowrap'>
      <AnimateIn className='w-full @[64rem]/app:w-[calc(50%-8px)] @[80rem]/app:w-1/3' delay='100ms'>
        <Sales />
      </AnimateIn>
      <AnimateIn className='w-full @[64rem]/app:w-[calc(50%-8px)] @[80rem]/app:w-1/3' delay='200ms'>
        <Premium />
      </AnimateIn>
      <AnimateIn className='w-full @[80rem]/app:w-1/3' delay='300ms'>
        <Registrations />
      </AnimateIn>
    </div>
  )
}

export default RecentContainer
