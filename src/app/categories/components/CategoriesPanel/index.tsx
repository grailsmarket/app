'use client'

import React from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectCategoriesPageFilters, setCategoriesPageSearch } from '@/state/reducers/filters/categoriesPageFilters'
import { selectFilterPanel, setFilterPanelOpen } from '@/state/reducers/filterPanel'
import { useNavbar } from '@/context/navbar'
import { cn } from '@/utils/tailwind'
import FilterIcon from 'public/icons/filter.svg'
import MagnifyingGlass from 'public/icons/search.svg'
import CategoriesSortDropdown from '../CategoriesSortDropdown'
import CategoryRow from '../categoryRow'
import { useFilteredCategories } from '../../hooks/useFilteredCategories'

const CategoriesPanel: React.FC = () => {
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectCategoriesPageFilters)
  const filterPanel = useAppSelector(selectFilterPanel)
  const filtersOpen = filterPanel.open
  const { isNavbarVisible } = useNavbar()
  const { categories, isLoading } = useFilteredCategories()

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setCategoriesPageSearch(e.target.value))
  }

  const toggleFilters = () => {
    dispatch(setFilterPanelOpen(!filtersOpen))
  }

  return (
    <div className='z-0 flex w-full flex-col'>
      {/* Top bar */}
      <div
        className={cn(
          'py-md md:py-lg px-md transition-top lg:px-lg bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-14 md:top-[70px]' : 'top-0'
        )}
      >
        <div className='flex w-full items-center gap-2 sm:w-fit'>
          {/* Filter toggle button */}
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={toggleFilters}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>

          {/* Search input */}
          <div className='group border-tertiary flex h-9 w-[calc(100%-39px)] items-center justify-between gap-1.5 rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/50 sm:h-10 sm:w-fit'>
            <input
              type='text'
              placeholder='Search categories'
              value={filters.search || ''}
              onChange={handleSearchChange}
              className='w-full bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
            />
            <Image
              src={MagnifyingGlass}
              alt='Search'
              width={16}
              height={16}
              className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
            />
          </div>

          {/* Sort dropdown - hidden on mobile */}
          <div className='hidden sm:block'>
            <CategoriesSortDropdown />
          </div>
        </div>

        {/* Sort dropdown - visible on mobile */}
        <div className='flex w-full items-center justify-between gap-2 sm:hidden'>
          <CategoriesSortDropdown />
        </div>
      </div>

      {/* Categories grid */}
      <div className='px-md lg:px-lg'>
        {isLoading ? (
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className='bg-secondary h-[320px] animate-pulse rounded-lg' />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className='grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-4 xl:grid-cols-3 2xl:grid-cols-4'>
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
