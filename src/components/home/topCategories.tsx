'use client'

import CategoryRow from '@/app/categories/components/categoryRow'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { cn } from '@/utils/tailwind'
import { Arrow } from 'ethereum-identity-kit'
import Link from 'next/link'
import React from 'react'

const TopCategories = () => {
  const { categories } = useCategories()

  return (
    <div className='w-full'>
      <div className=' px-md py-lg sm:p-xl flex items-center justify-between'>
        <h2 className='font-sedan-sc text-4xl sm:text-5xl md:text-6xl'>Top Categories</h2>
        <Link
          href='/categories'
          className='text-primary hover:text-primary/80 flex justify-end items-center gap-2 text-center text-xl sm:text-2xl font-semibold'
        >
          <p>View All</p>
          <Arrow className='text-primary h-3 w-3 sm:h-4 sm:w-4 rotate-180' />
        </Link>
      </div>
      <div className='flex w-full flex-wrap justify-center gap-4 lg:flex-nowrap'>
        {categories?.slice(0, 3).map((category, index) => (
          <div
            className={cn(index === 0 ? 'w-full lg:w-1/3' : 'w-full sm:w-[calc(50%-8px)] lg:w-1/3')}
            key={category.name}
          >
            <CategoryRow category={category} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopCategories
