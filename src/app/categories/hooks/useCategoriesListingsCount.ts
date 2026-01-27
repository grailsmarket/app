import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/categoriesListingsFilters'
import { useQuery } from '@tanstack/react-query'

export const useCategoriesListingsCount = () => {
  return useQuery({
    queryKey: ['categoriesPage', 'listings', 'count'],
    queryFn: async () => {
      const result = await fetchDomains({
        limit: 1,
        pageParam: 1,
        filters: emptyFilterState,
        searchTerm: '',
        enableBulkSearch: false,
        isAuthenticated: false,
        inAnyCategory: true,
      })

      return result.total || 0
    },
    staleTime: 60000, // 1 minute
  })
}
