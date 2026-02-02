'use client'

import React from 'react'
import MainPanel from './main-panel'
import { useCategories } from '@/components/filters/hooks/useCategories'
import CategoryDetails from './categoryDetails'
import PrimaryButton from '@/components/ui/buttons/primary'
import Link from 'next/link'

interface Props {
  category: string
}

const CategoryPage: React.FC<Props> = ({ category }) => {
  const { categories: allCategories, categoriesLoading } = useCategories()
  const categoryDetails = allCategories?.find((item) => item.name === category)

  if (categoriesLoading) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4'>
        <p className='text-2xl font-bold'>Loading...</p>
      </div>
    )
  }

  if (!categoryDetails) {
    return (
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4'>
        <p className='text-2xl font-bold'>Category not found</p>
        <Link href='/categories'>
          <PrimaryButton>View All Categories</PrimaryButton>
        </Link>
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
