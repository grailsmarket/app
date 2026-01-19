import { useQuery } from '@tanstack/react-query'
import { fetchNameDetails } from '@/api/name/details'
import { MarketplaceDomainType } from '@/types/domains'

interface SimilarNamesAPIResponse {
  suggestions: string[]
  error?: string
}

/**
 * Fetches AI-generated similar name suggestions from the API
 */
async function fetchSimilarNames(name: string): Promise<string[]> {
  const response = await fetch(`/api/ai/similar-names?name=${encodeURIComponent(name)}`)

  if (!response.ok) {
    throw new Error('Failed to fetch similar names')
  }

  const data: SimilarNamesAPIResponse = await response.json()
  return data.suggestions || []
}

/**
 * Fetches domain details for multiple names in parallel
 */
async function fetchDomainsForNames(names: string[]): Promise<MarketplaceDomainType[]> {
  const domains = await Promise.all(
    names.map(async (name) => {
      try {
        const details = await fetchNameDetails(`${name}.eth`)
        return details
      } catch (error) {
        console.error(`Error fetching details for ${name}:`, error)
        return null
      }
    })
  )

  // Filter out any failed fetches
  return domains.filter((d): d is MarketplaceDomainType => d !== null)
}

/**
 * Hook to get AI-suggested similar names with full domain data
 */
export const useSimilarNames = (ensName: string) => {
  // First, fetch the AI suggestions
  const {
    data: suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useQuery({
    queryKey: ['similar-names', 'suggestions', ensName],
    queryFn: () => fetchSimilarNames(ensName),
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
  const error = suggestionsError || domainsError

  return {
    domains: domains || [],
    suggestions: suggestions || [],
    isLoading,
    error,
  }
}

