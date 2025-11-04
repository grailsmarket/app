import { fetchClubs } from '@/api/domains/fetchClubs'
import { useQuery } from '@tanstack/react-query'

export const useCategories = () => {
  const { data: categories } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const results = await fetchClubs()
      return results
    },
  })

  return {
    categories,
  }
}
