'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectCategoriesPageFilters } from '@/state/reducers/filters/categoriesPageFilters'
import { fetchFilteredCategories } from '@/api/categories/fetchFilteredCategories'
import { useMemo } from 'react'
import { CategoryType } from '@/types/domains'
import { CATEGORY_IMAGES } from '@/app/categories/[category]/components/categoryDetails'

export const useFilteredCategories = () => {
  const filters = useAppSelector(selectCategoriesPageFilters)

  const { data: categories, isLoading } = useQuery({
    queryKey: ['filteredCategories', filters.type, filters.sort, filters.sortDirection],
    queryFn: async () => {
      const results = await fetchFilteredCategories({
        type: filters.type,
        sort: filters.sort,
        sortDirection: filters.sortDirection,
      })
      return results
    },
  })

  // Apply local search filter and exclude categories without frontend configuration
  const filteredCategories = useMemo(() => {
    if (!categories) return []

    // Filter out categories that don't have frontend images configured
    const configuredCategories = categories.filter(
      (category: CategoryType) => category.name in CATEGORY_IMAGES
    )

    const searchTerm = filters.search.toLowerCase().trim()
    if (!searchTerm) return configuredCategories

    return configuredCategories.filter((category: CategoryType) =>
      category.name.toLowerCase().includes(searchTerm)
    )
  }, [categories, filters.search])

  return {
    categories: filteredCategories,
    isLoading,
    filters,
  }
}
