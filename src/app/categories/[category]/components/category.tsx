'use client'

import React from 'react'
import MainPanel from './main-panel'
import { useCategories } from '@/components/filters/hooks/useCategories'
import CategoryDetails from './categoryDetails'

interface Props {
  category: string
}

const CategoryPage: React.FC<Props> = ({ category }) => {
  const { categories: allCategories } = useCategories()
  const categoryDetails = allCategories?.find((item) => item.name === category)

  if (!categoryDetails) {
    return (
      <div className='w-full items-center justify-center pt-40'>
        <p className='text-2xl font-bold'>Club not found</p>
      </div>
    )
  }

  return (
    <div className='flex w-full flex-col'>
      <CategoryDetails categoryDetails={categoryDetails} />
      <MainPanel category={category} />
    </div>
  )
}

export default CategoryPage
