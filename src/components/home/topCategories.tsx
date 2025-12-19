'use client'

import CategoryRow from '@/app/categories/components/categoryRow'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { cn } from '@/utils/tailwind'
import React from 'react'

const TopCategories = () => {
  const { categories } = useCategories()

  return (
    <div className='w-full'>
      <h2 className='font-sedan-sc p-xl text-center text-5xl md:text-6xl lg:text-left'>Top Categories</h2>
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
