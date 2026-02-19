import React from 'react'
import Registrations from './registrations'
import Sales from './sales'
import Premium from './premium'
import AnimateIn from '@/components/ui/animateIn'

const RecentContainer = () => {
  return (
    <div className='flex w-full flex-row flex-wrap items-center justify-center gap-4 xl:flex-nowrap'>
      <AnimateIn className='w-full lg:w-[calc(50%-8px)] xl:w-1/3'>
        <Sales />
      </AnimateIn>
      <AnimateIn className='w-full lg:w-[calc(50%-8px)] xl:w-1/3' delay='300ms'>
        <Premium />
      </AnimateIn>
      <AnimateIn className='w-full xl:w-1/3' delay='400ms'>
        <Registrations />
      </AnimateIn>
    </div>
  )
}

export default RecentContainer
