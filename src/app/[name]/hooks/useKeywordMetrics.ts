import { useQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'

export interface KeywordMetrics {
  avgMonthlySearches: number | null
  monthlyTrend: { month: string; year: number; searches: number }[]
  relatedKeywordCount: number
  competition: string | null
}

class KeywordMetricsError extends Error {
  status?: number
}

function isSubdomain(ensName: string): boolean {
  const withoutEth = ensName.replace(/\.eth$/, '')
  const parts = withoutEth.split('.')
  return parts.length > 1
}

function extractKeyword(ensName: string): string {
  if (isSubdomain(ensName)) {
    return ''
  }
  return ensName.replace(/\.eth$/, '')
}

async function fetchKeywordMetrics(keyword: string): Promise<KeywordMetrics> {
  const response = await fetch(`/api/keywords/${encodeURIComponent(keyword)}`)

  if (!response.ok) {
    const error = new KeywordMetricsError('Failed to fetch keyword metrics')
    error.status = response.status
    throw error
  }

  return response.json()
}

export const useKeywordMetrics = (ensName: string, expiryDate?: string | null) => {
  const { authStatus } = useUserContext()
  const isSubdomainName = isSubdomain(ensName)
  const keyword = extractKeyword(ensName)
  const isTooLong = keyword.length > 20
  // Only query if the name has ever existed in the DB (expiry_date non-null)
  // undefined means nameDetails hasn't loaded yet — wait before querying
  const hasEverExisted = expiryDate === undefined ? false : expiryDate !== null

  const {
    data: keywordMetrics,
    isLoading: keywordMetricsIsLoading,
    error: keywordMetricsError,
  } = useQuery({
    queryKey: ['keyword', 'metrics', keyword],
    queryFn: () => fetchKeywordMetrics(keyword),
    enabled: !!keyword && keyword.length > 0 && !isSubdomainName && !isTooLong && authStatus === 'authenticated' && hasEverExisted,
    retry: (failureCount, error) => {
      if (error instanceof KeywordMetricsError && (error.status === 401 || error.status === 403)) {
        return false
      }
      return failureCount < 2
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })

  return {
    keywordMetrics,
    keywordMetricsIsLoading,
    keywordMetricsError,
    keyword,
    isSubdomain: isSubdomainName,
    isTooLong,
  }
}
