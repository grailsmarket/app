import { useQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'
import { fetchKeywordMetrics } from '@/api/domains/fetchKeywordMetrics'

function isSubdomain(ensName: string): boolean {
  const withoutEth = ensName.replace('.eth', '')
  const parts = withoutEth.split('.')
  return parts.length > 1
}

export const useKeywordMetrics = (ensName: string, expiryDate?: string | null) => {
  const { authStatus } = useUserContext()
  const isSubdomainName = isSubdomain(ensName)
  const keyword = isSubdomainName ? '' : ensName.replaceAll('.eth', '').toLowerCase()
  const isTooLong = keyword.length > 20

  const isInDatabase = !!expiryDate
  const queryEnabled =
    !!keyword && keyword.length > 0 && !isSubdomainName && !isTooLong && authStatus === 'authenticated' && isInDatabase

  const {
    data: keywordMetrics,
    isLoading: keywordMetricsIsLoading,
    error: keywordMetricsError,
  } = useQuery({
    queryKey: ['keyword', 'metrics', keyword],
    queryFn: () => fetchKeywordMetrics(keyword),
    enabled: queryEnabled,
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
