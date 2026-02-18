'use client'

import { fetchFilteredCategories } from '@/api/categories/fetchFilteredCategories'
import CategoriesSortDropdown from '@/app/categories/components/CategoriesSortDropdown'
import CategoryRow from '@/app/categories/components/categoryRow'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectCategoriesPageFilters,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
} from '@/state/reducers/filters/categoriesPageFilters'
import { cn } from '@/utils/tailwind'
import { useQuery } from '@tanstack/react-query'
import { Arrow, useWindowSize } from 'ethereum-identity-kit'
import Link from 'next/link'
import React, { useEffect, useMemo } from 'react'
import LoadingCell from '../ui/loadingCell'
import { DEFAULT_CATEGORIES_PAGE_SORT } from '@/constants/filters/categoriesPageFilters'

const TopCategories = () => {
  const { width } = useWindowSize()
  const dispatch = useAppDispatch()
  const filters = useAppSelector(selectCategoriesPageFilters)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', filters.sort, filters.sortDirection],
    queryFn: async () => {
      const results = await fetchFilteredCategories({
        sort: filters.sort,
        sortDirection: filters.sortDirection,
      })

      return results
    },
  })

  useEffect(() => {
    dispatch(setCategoriesPageSort(DEFAULT_CATEGORIES_PAGE_SORT))
    dispatch(setCategoriesPageSortDirection('desc'))

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categoryCount = useMemo(() => {
    if (width && width < 640) return 3
    if (width && width < 768) return 4
    return 6
  }, [width])

  return (
    <div className='w-full'>
      <div className='px-sm sm:px-md py-lg sm:p-xl flex items-center justify-between'>
        <div className='flex flex-col gap-1 sm:gap-2 lg:flex-row lg:items-center lg:gap-4'>
          <h2 className='font-sedan-sc pb-1 text-4xl leading-11 sm:text-5xl md:text-6xl'>Top Categories</h2>
          <CategoriesSortDropdown />
        </div>
        <Link
          href='/categories'
          className='text-primary hover:text-primary/80 flex items-center justify-end gap-2 text-center text-xl font-semibold sm:text-2xl'
        >
          <p>View All</p>
          <Arrow className='text-primary h-3 w-3 rotate-180 sm:h-4 sm:w-4' />
        </Link>
      </div>
      <div className='flex w-full flex-wrap justify-center gap-4'>
        {isLoading
          ? Array(categoryCount)
              .fill(null)
              .map((_, index) => (
                <div
                  className={cn(
                    index === 0
                      ? 'w-full lg:w-[calc(33.33%-12px)]'
                      : 'w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]'
                  )}
                  key={index}
                >
                  <LoadingCell radius='8px' height={'230px'} width={'100%'} />
                </div>
              ))
          : categories?.slice(0, categoryCount).map((category) => (
              <div className='w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]' key={category.name}>
                <CategoryRow category={category} reduceColumns={true} />
              </div>
            ))}
      </div>
    </div>
  )
}

export default TopCategories
