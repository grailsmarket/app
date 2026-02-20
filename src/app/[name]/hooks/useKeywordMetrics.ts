import { useQuery } from '@tanstack/react-query'
import { useUserContext } from '@/context/user'
import { fetchKeywordMetrics } from '@/api/domains/fetchKeywordMetrics'
import { useEffect, useState } from 'react'

function isSubdomain(ensName: string): boolean {
  const withoutEth = ensName.replace('.eth', '')
  const parts = withoutEth.split('.')
  return parts.length > 1
}

export const useKeywordMetrics = (ensName: string, expiryDate?: string | null) => {
  const [loginRequired, setLoginRequired] = useState(false)
  const { authStatus } = useUserContext()
  const isAuthenticated = authStatus === 'authenticated'
  const isSubdomainName = isSubdomain(ensName)
  const keyword = isSubdomainName ? '' : ensName.replaceAll('.eth', '').toLowerCase()
  const isTooLong = keyword.length > 20

  const isInDatabase = !!expiryDate
  const queryEnabled = !!keyword && keyword.length > 0 && !isSubdomainName && !isTooLong && isInDatabase

  const {
    data: keywordMetrics,
    isLoading: keywordMetricsIsLoading,
    error: keywordMetricsError,
    refetch: refetchKeywordMetrics,
    isRefetching: keywordMetricsIsRefetching,
  } = useQuery({
    queryKey: ['keyword', 'metrics', keyword],
    queryFn: async () => {
      const result = await fetchKeywordMetrics({ keyword, isAuthenticated })

      if (typeof result === 'string') {
        if (result === 'login_required') setLoginRequired(true)

        return null
      }

      return result
    },
    enabled: queryEnabled,
    refetchOnWindowFocus: false,
  })

  // Refetch on sign in if login was required
  useEffect(() => {
    if (loginRequired && isAuthenticated) {
      refetchKeywordMetrics()
      setLoginRequired(false)
    }
  }, [loginRequired, refetchKeywordMetrics, isAuthenticated])

  return {
    loginRequired,
    keywordMetrics,
    keywordMetricsIsLoading: keywordMetricsIsLoading || keywordMetricsIsRefetching,
    keywordMetricsError,
    keyword,
    isSubdomain: isSubdomainName,
    isTooLong,
  }
}
