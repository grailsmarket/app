import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType, KeywordMetrics } from '@/types/api'

interface FetchKeywordMetricsOptions {
  keyword: string
  isAuthenticated?: boolean
}

export const fetchKeywordMetrics = async ({
  keyword,
  isAuthenticated = false,
}: FetchKeywordMetricsOptions): Promise<KeywordMetrics | null | string> => {
  try {
    const fetchFunction = isAuthenticated ? authFetch : fetch
    const response = await fetchFunction(`${API_URL}/google-metrics/${encodeURIComponent(keyword)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 401) {
      return 'login_required'
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch keyword metrics: ${response.statusText}`)
    }

    const data = (await response.json()) as APIResponseType<KeywordMetrics>
    return data.data ?? null
  } catch (error) {
    console.error('Failed to fetch keyword metrics:', error)
    return null
  }
}
