import { queryOptions } from '@tanstack/react-query'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { fetchFilteredCategories } from '@/api/categories/fetchFilteredCategories'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'

export const categoriesDropdownQueryOptions = () =>
  queryOptions({
    queryKey: ['navigation', 'categories'],
    queryFn: () =>
      fetchFilteredCategories({
        sort: 'sales_volume_wei_1w',
        sortDirection: 'desc',
      }),
  })

export const exploreDropdownQueryOptions = (isAuthenticated: boolean) =>
  queryOptions({
    queryKey: ['explore', 'listings'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 2,
        filters: {
          ...emptyFilterState,
          market: {
            ...emptyFilterState.market,
            Listed: 'yes',
          },
          type: {
            Digits: 'exclude',
            Emojis: 'exclude',
            Repeating: 'include',
            Letters: 'include',
          },
        },
        searchTerm: '',
        isAuthenticated,
        inAnyCategory: true,
        excludeCategories: ['prepunks'],
      }),
  })

export const premiumDropdownQueryOptions = (isAuthenticated: boolean) =>
  queryOptions({
    queryKey: ['navigation', 'premium'],
    queryFn: () =>
      fetchDomains({
        limit: 7,
        pageParam: 1,
        filters: {
          ...emptyFilterState,
          status: ['Premium'],
          sort: 'watchers_count_desc',
          type: {
            Digits: 'exclude',
            Emojis: 'exclude',
            Repeating: 'include',
            Letters: 'include',
          },
        },
        searchTerm: '',
        isAuthenticated,
        inAnyCategory: true,
      }),
  })
