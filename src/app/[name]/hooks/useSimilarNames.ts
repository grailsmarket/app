import { getRecommendations } from '@/api/ai/getRecommendations'
import { API_URL } from '@/constants/api'
import { normalizeName } from '@/lib/ens'
import { APIResponseType, PaginationType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { generateEmptyName } from '@/utils/generateEmptyName'
import { useQuery } from '@tanstack/react-query'
import { hexToBigInt, labelhash } from 'viem'

type SimilarNamesStatus = 'loading' | 'login_required' | 'empty' | 'ready' | 'error'

const fetchDomainsForNames = async (names: string[]): Promise<MarketplaceDomainType[]> => {
  try {
    const res = await fetch(`${API_URL}/search/bulk-filters`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        terms: names,
        page: 1,
        limit: names.length,
      }),
    })

    if (!res.ok) {
      throw new Error('Bulk fetch failed')
    }

    const json = (await res.json()) as APIResponseType<{
      names: MarketplaceDomainType[]
      results: MarketplaceDomainType[]
      pagination: PaginationType
    }>

    const domains = [...(json.data.names || json.data.results || [])]
    const domainNameSet = new Set(
      domains.map((domain) =>
        normalizeName(domain.name)
          .replace(/\.eth$/i, '')
          .toLowerCase()
      )
    )

    for (const name of names) {
      const normalizedSuggestion = normalizeName(name)
        .replace(/\.eth$/i, '')
        .toLowerCase()
      if (domainNameSet.has(normalizedSuggestion)) {
        continue
      }

      const domain = generateEmptyName(
        `${normalizedSuggestion}.eth`,
        hexToBigInt(labelhash(normalizedSuggestion)).toString()
      )
      domains.push(domain)
    }

    return domains
  } catch (error) {
    console.error('Error bulk fetching domain details:', error)
    return []
  }
}

export const useSimilarNames = (name: string) => {
  const { data: recommendations, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['similar-names', 'suggestions', name],
    queryFn: () => getRecommendations(name),
    enabled: !!name && name.length > 0,
    refetchOnWindowFocus: false,
  })

  const suggestions = recommendations?.suggestions || []
  const canLoadDomains = recommendations?.status === 'ready' && suggestions.length > 0

  const {
    data: domains,
    isLoading: domainsLoading,
    error: domainsError,
  } = useQuery({
    queryKey: ['similar-names', 'domains', suggestions],
    queryFn: () => fetchDomainsForNames(suggestions),
    enabled: canLoadDomains,
    refetchOnWindowFocus: false,
  })

  const isLoading = suggestionsLoading || (canLoadDomains && domainsLoading)
  const loadingPhase = suggestionsLoading ? 'ai' : domainsLoading ? 'domains' : null

  let status: SimilarNamesStatus = 'empty'
  if (isLoading) {
    status = 'loading'
  } else if (recommendations?.status === 'login_required') {
    status = 'login_required'
  } else if (recommendations?.status === 'error' || domainsError) {
    status = 'error'
  } else if (recommendations?.status === 'empty' || !domains || domains.length === 0) {
    status = 'empty'
  } else {
    status = 'ready'
  }

  return {
    domains: domains || [],
    suggestions,
    isLoading,
    loadingPhase,
    status,
    isEmpty: status === 'empty',
  }
}
