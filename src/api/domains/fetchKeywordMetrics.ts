import { KeywordMetrics } from '@/types/api'

export const fetchKeywordMetrics = async (keyword: string): Promise<KeywordMetrics> => {
  const response = await fetch(`/api/keywords/${encodeURIComponent(keyword)}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch keyword metrics: ${response.statusText}`)
  }

  return response.json()
}
