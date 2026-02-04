'use client'

import React from 'react'
import CategoryRow from '../categoryRow'
import { useFilteredCategories } from '../../hooks/useFilteredCategories'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { cn } from '@/utils/tailwind'

const CategoriesPanel: React.FC = () => {
  const { categories, isLoading } = useFilteredCategories()
  const { selectors } = useFilterRouter()
  const isOpen = selectors.filters.open

  return (
    <div className='z-0 flex w-full flex-col'>
      {/* Top bar */}
      {/* <div
        className={cn(
          'py-md md:py-lg px-md transition-top lg:px-lg bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='flex w-full items-center gap-2 sm:w-fit'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={toggleFilters}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>

          <div className='group border-tertiary flex h-9 w-[calc(100%-39px)] items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:h-10 sm:w-fit'>
            <input
              type='text'
              placeholder='Search categories'
              value={filters.search || ''}
              onChange={handleSearchChange}
              className='w-full bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
            />
            {filters.search.length > 0 ? (
              <Cross
                onClick={() => {
                  dispatch(setCategoriesPageSearch(''))
                }}
                className='h-4 w-4 cursor-pointer p-0.5 opacity-100 transition-opacity hover:opacity-70'
              />
            ) : (
              <Image
                src={MagnifyingGlass}
                alt='Search'
                width={16}
                height={16}
                className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
              />
            )}
          </div>

          <div className='hidden sm:block'>
            <CategoriesSortDropdown />
          </div>
        </div>

        <div className='flex w-full items-center justify-between gap-2 sm:hidden'>
          <CategoriesSortDropdown />
        </div>
      </div> */}

      {/* Categories grid */}
      <div className='px-md lg:px-lg py-lg'>
        {isLoading ? (
          <div
            className={cn(
              'grid gap-2 md:gap-4',
              isOpen
                ? '3xl:grid-cols-3 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-2'
                : '3xl:grid-cols-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3'
            )}
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className='bg-secondary h-[380px] animate-pulse rounded-lg' />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div
            className={cn(
              'grid gap-2 md:gap-4',
              isOpen
                ? '3xl:grid-cols-4 grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
                : '4xl:grid-cols-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
            )}
          >
            {categories.map((category) => (
              <CategoryRow key={category.name} category={category} />
            ))}
          </div>
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
