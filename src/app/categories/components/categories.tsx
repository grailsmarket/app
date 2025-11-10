'use client'

import { useCategories } from '@/components/filters/hooks/useCategories'
import React from 'react'
import CategoryRow from './categoryRow'

const Categories = () => {
  const { categories } = useCategories()

  return (
    <div className='p-md max-w-domain-panel border-primary mx-auto flex flex-col gap-4 rounded-lg border-2 pt-4'>
      <div className='px-lg flex w-full items-center justify-between'>
        <p className='text-md w-1/3 font-semibold'>Category</p>
        <p className='text-md w-1/6 font-semibold'>Names</p>
        <p className='text-md w-1/6 font-semibold'>Sales</p>
        <p className='text-md w-1/6 font-semibold'>Floor Price</p>
        <p className='text-md w-32 font-semibold'></p>
      </div>
      {categories?.map((category) => (
        <CategoryRow key={category.name} category={category} />
      ))}
    </div>
  )
}

export default Categories
