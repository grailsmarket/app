import { fetchCategories } from '@/api/domains/fetchCategories'
import { fetchUserCategories } from '@/api/domains/fetchUserCategories'
import { useFilterContext } from '@/context/filters'
import { useQuery } from '@tanstack/react-query'

interface UseCategoriesOptions {
  enabled?: boolean
}

export const useCategories = ({ enabled = true }: UseCategoriesOptions = {}) => {
  const { profileAddress } = useFilterContext()
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const results = await fetchCategories()
      return results
    },
    enabled,
  })

  const { data: userCategories } = useQuery({
    queryKey: ['userCategories', profileAddress],
    queryFn: async () => {
      if (!profileAddress) return null

      const results = await fetchUserCategories(profileAddress)
      return results
    },
    enabled: enabled && !!profileAddress,
  })

  return {
    categories,
    categoriesLoading: isLoading,
    userCategoryCounts: userCategories,
  }
}
