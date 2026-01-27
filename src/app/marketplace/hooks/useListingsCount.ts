import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceListingsFilters'
import { useQuery } from '@tanstack/react-query'

export const useListingsCount = () => {
  return useQuery({
    queryKey: ['marketplace', 'listings', 'count'],
    queryFn: async () => {
      const result = await fetchDomains({
        limit: 1,
        pageParam: 1,
        filters: emptyFilterState,
        searchTerm: '',
        enableBulkSearch: false,
        isAuthenticated: false,
      })

      return result.total || 0
    },
    staleTime: 60000, // 1 minute
  })
}
