'use client'

import React from 'react'
import CategoryCard from '../categoryCard'
import CategoryRow from '../categoryRow'
import { useFilteredCategories } from '../../hooks/useFilteredCategories'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppSelector } from '@/state/hooks'
import { selectViewType } from '@/state/reducers/view'
import { cn } from '@/utils/tailwind'

const CategoriesPanel: React.FC = () => {
  const { categories, isLoading } = useFilteredCategories()
  const { selectors } = useFilterRouter()
  const isOpen = selectors.filters.open
  const viewType = useAppSelector(selectViewType)

  const gridClasses = cn(
    'grid gap-2 md:gap-4',
    isOpen
      ? '3xl:grid-cols-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
      : '4xl:grid-cols-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
  )

  return (
    <div className='z-0 flex w-full flex-col'>
      {/* Categories grid/list */}
      <div className={cn('py-lg', viewType === 'list' ? 'p-0!' : 'px-md lg:px-lg')}>
        {isLoading ? (
          viewType === 'list' ? (
            <div className='flex flex-col'>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className='bg-secondary border-tertiary h-[72px] animate-pulse border-b' />
              ))}
            </div>
          ) : (
            <div className={gridClasses}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className='bg-secondary h-[380px] animate-pulse rounded-lg' />
              ))}
            </div>
          )
        ) : categories && categories.length > 0 ? (
          viewType === 'list' ? (
            <div className='flex flex-col'>
              {categories.map((category) => (
                <CategoryRow key={category.name} category={category} />
              ))}
            </div>
          ) : (
            <div className={gridClasses}>
              {categories.map((category) => (
                <CategoryCard key={category.name} category={category} />
              ))}
            </div>
          )
        ) : (
          <div className='flex h-[200px] items-center justify-center'>
            <p className='text-neutral text-lg'>No categories found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoriesPanel
