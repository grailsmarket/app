'use client'

import { useCategories } from '@/components/filters/hooks/useCategories'
import React from 'react'
import CategoryRow from './categoryRow'

const Categories = () => {
  const { categories } = useCategories()

  return (
    <div className='mx-auto grid max-w-7xl grid-cols-1 items-center justify-center gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-3'>
      {categories?.map((category) => (
        <CategoryRow key={category.name} category={category} />
      ))}
    </div>
  )
}

export default Categories
