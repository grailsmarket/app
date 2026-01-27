import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/categoryListingsFilters'
import { useQuery } from '@tanstack/react-query'

export const useCategoryListingsCount = (category: string) => {
  return useQuery({
    queryKey: ['category', category, 'listings', 'count'],
    queryFn: async () => {
      const result = await fetchDomains({
        limit: 1,
        pageParam: 1,
        filters: emptyFilterState,
        searchTerm: '',
        category,
        enableBulkSearch: false,
        isAuthenticated: false,
      })

      return result.total || 0
    },
    staleTime: 60000, // 1 minute
    enabled: !!category,
  })
}
