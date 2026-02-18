import { getRecommendations } from '@/api/domains/fetchRecommendations'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { useUserContext } from '@/context/user'
import { normalizeName } from '@/lib/ens'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { generateEmptyName } from '@/utils/generateEmptyName'
import { useQuery } from '@tanstack/react-query'
import { hexToBigInt, labelhash } from 'viem'
import { useEffect } from 'react'

export const useSimilarNames = (name: string) => {
  const { authStatus } = useUserContext()

  const {
    data: recommendations,
    isLoading: suggestionsLoading,
    refetch: refetchSuggestions,
    isRefetching: suggestionsIsRefetching,
  } = useQuery({
    queryKey: ['similar-names', 'suggestions', name],
    queryFn: () => getRecommendations({ name, isAuthenticated: authStatus === 'authenticated' }),
    enabled: !!name && name.length > 0,
    refetchOnWindowFocus: false,
  })

  const suggestions = recommendations?.suggestions || []
  const suggestionsStatus = recommendations?.status || 'empty'
  const canLoadDomains = recommendations?.status === 'ready' && suggestions.length > 0

  // Make sure to refetch on sign in only when login is required
  useEffect(() => {
    if (suggestionsStatus === 'login_required' && authStatus === 'authenticated') {
      refetchSuggestions()
    }
  }, [authStatus, refetchSuggestions, suggestionsStatus])

  const { data: domains, isLoading: domainsLoading } = useQuery({
    queryKey: ['similar-names', 'domains', suggestions],
    queryFn: async () => {
      const res = await fetchDomains({
        searchTerm: suggestions.join(','),
        limit: suggestions.length,
        pageParam: 1,
        filters: emptyFilterState,
        enableBulkSearch: true,
        isAuthenticated: authStatus === 'authenticated',
      })

      const domains = [...res.domains]

      suggestions.forEach((suggestion) => {
        const normalizedSuggestion = normalizeName(suggestion).replace('.eth', '').toLowerCase()
        const domain = domains.find((domain) => domain.name.replace('.eth', '').toLowerCase() === normalizedSuggestion)
        if (!domain) {
          domains.push(generateEmptyName(`${suggestion}.eth`, hexToBigInt(labelhash(suggestion)).toString()))
        }
      })

      return domains
    },
    enabled: canLoadDomains,
    refetchOnWindowFocus: false,
  })

  const isSuggestionsLoading = suggestionsLoading || suggestionsIsRefetching
  const isLoading = isSuggestionsLoading || (canLoadDomains && domainsLoading)
  const loadingPhase = isSuggestionsLoading ? 'suggestions' : domainsLoading ? 'domains' : null

  return {
    domains: domains || [],
    suggestions,
    isLoading,
    loadingPhase,
    suggestionsStatus,
    isEmpty: !isLoading && (domains?.length || 0) === 0,
  }
}
