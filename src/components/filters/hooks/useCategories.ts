import { fetchCategories } from '@/api/domains/fetchCategories'
import { useQuery } from '@tanstack/react-query'

export const useCategories = () => {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const results = await fetchCategories()
      return results
    },
  })

  return {
    categories,
  }
}
