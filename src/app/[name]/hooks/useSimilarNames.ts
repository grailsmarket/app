import { useQuery } from '@tanstack/react-query'
import { MarketplaceDomainType } from '@/types/domains'
import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { hexToBigInt, labelhash } from 'viem'

interface SimilarNamesAPIResponse {
  suggestions: string[]
  error?: string
}

/**
 * Fetches AI-generated similar name suggestions from the API
 */
async function fetchSimilarNames(name: string, categories?: string[]): Promise<string[]> {
  let url = `/api/ai/similar-names?name=${encodeURIComponent(name)}`
  if (categories && categories.length > 0) {
    url += `&categories=${encodeURIComponent(categories.join(','))}`
  }

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch similar names')
  }

  const data: SimilarNamesAPIResponse = await response.json()
  return data.suggestions || []
}

/**
 * Fetches domain details for multiple names in a single bulk request
 */
async function fetchDomainsForNames(names: string[]): Promise<MarketplaceDomainType[]> {
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

    const domains = json.data.names || json.data.results || []

    // Insert placeholders for names not returned by the DB (same pattern as fetchDomains)
    for (const name of names) {
      const domainName = name + '.eth'
      if (!domains.some((d) => d.name === domainName)) {
        domains.push({
          id: 0,
          name: domainName,
          token_id: hexToBigInt(labelhash(name)).toString(),
          expiry_date: null,
          registration_date: null,
          owner: null,
          metadata: {},
          has_numbers: false,
          has_emoji: false,
          listings: [],
          clubs: [],
          highest_offer_wei: null,
          highest_offer_id: null,
          highest_offer_currency: null,
          last_sale_price_usd: null,
          offer: null,
          last_sale_price: null,
          last_sale_currency: null,
          last_sale_date: null,
          view_count: 0,
          watchers_count: 0,
          downvotes: 0,
          upvotes: 0,
          watchlist_record_id: null,
        })
      }
    }

    return domains
  } catch (error) {
    console.error('Error bulk fetching domain details:', error)
    return []
  }
}

/**
 * Hook to get AI-suggested similar names with full domain data
 * @param ensName - The ENS name to find similar names for
 * @param categories - Optional array of category/club names for context
 */
export const useSimilarNames = (ensName: string, categories?: string[]) => {
  // First, fetch the AI suggestions
  const {
    data: suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useQuery({
    queryKey: ['similar-names', 'suggestions', ensName, categories],
    queryFn: () => fetchSimilarNames(ensName, categories),
    enabled: !!ensName && ensName.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour - matches server cache
    refetchOnWindowFocus: false,
  })

  // Then, fetch domain details for each suggestion
  const {
    data: domains,
    isLoading: domainsLoading,
    error: domainsError,
  } = useQuery({
    queryKey: ['similar-names', 'domains', suggestions],
    queryFn: () => fetchDomainsForNames(suggestions || []),
    enabled: !!suggestions && suggestions.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes for domain data
    refetchOnWindowFocus: false,
  })

  const isLoading = suggestionsLoading || (!!suggestions && suggestions.length > 0 && domainsLoading)
  const loadingPhase = suggestionsLoading ? 'ai' : domainsLoading ? 'domains' : null
  const error = suggestionsError || domainsError

  return {
    domains: domains || [],
    suggestions: suggestions || [],
    isLoading,
    loadingPhase,
    error,
  }
}

