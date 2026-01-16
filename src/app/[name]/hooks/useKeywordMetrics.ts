import { useQuery } from '@tanstack/react-query'

export interface KeywordMetrics {
  avgMonthlySearches: number | null
  monthlyTrend: { month: string; year: number; searches: number }[]
  relatedKeywordCount: number
  competition: string | null
}

/**
 * Checks if the ENS name is a subdomain (has more than one part before .eth)
 * e.g., "test.eth" -> false, "sub.test.eth" -> true
 */
function isSubdomain(ensName: string): boolean {
  const withoutEth = ensName.replace(/\.eth$/, '')
  const parts = withoutEth.split('.')
  return parts.length > 1
}

/**
 * Extracts the base keyword from an ENS name
 * e.g., "test.eth" -> "test"
 * Returns empty string for subdomains (they should be skipped)
 */
function extractKeyword(ensName: string): string {
  if (isSubdomain(ensName)) {
    return '' // Skip subdomains
  }
  // Remove .eth suffix
  return ensName.replace(/\.eth$/, '')
}

async function fetchKeywordMetrics(keyword: string): Promise<KeywordMetrics> {
  const response = await fetch(`/api/keywords/${encodeURIComponent(keyword)}`)

  if (!response.ok) {
    throw new Error('Failed to fetch keyword metrics')
  }

  return response.json()
}

export const useKeywordMetrics = (ensName: string) => {
  const isSubdomainName = isSubdomain(ensName)
  const keyword = extractKeyword(ensName)

  const {
    data: keywordMetrics,
    isLoading: keywordMetricsIsLoading,
    error: keywordMetricsError,
  } = useQuery({
    queryKey: ['keyword', 'metrics', keyword],
    queryFn: () => fetchKeywordMetrics(keyword),
    enabled: !!keyword && keyword.length > 0 && !isSubdomainName,
    staleTime: 1000 * 60 * 60, // 1 hour - matches server cache
    refetchOnWindowFocus: false,
  })

  return {
    keywordMetrics,
    keywordMetricsIsLoading,
    keywordMetricsError,
    keyword,
    isSubdomain: isSubdomainName,
  }
}

