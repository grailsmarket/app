'use client'

import { useQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectCategoriesPageFilters } from '@/state/reducers/filters/categoriesPageFilters'
import { fetchFilteredCategories } from '@/api/categories/fetchFilteredCategories'
import { useMemo } from 'react'
import { CategoryType } from '@/types/domains'

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

  // Apply local search filter
  const filteredCategories = useMemo(() => {
    if (!categories) return []

    const searchTerm = filters.search.toLowerCase().trim()
    if (!searchTerm) return categories

    return categories.filter((category: CategoryType) => category.name.toLowerCase().includes(searchTerm))
  }, [categories, filters.search])

  return {
    categories: filteredCategories,
    isLoading,
    filters,
  }
}
