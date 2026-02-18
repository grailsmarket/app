import { authFetch } from '@/api/authFetch'
import { API_URL } from '@/constants/api'
import { normalizeName } from '@/lib/ens'
import { APIResponseType } from '@/types/api'

export type RecommendationsResult = {
  status: 'ready' | 'empty' | 'login_required' | 'error'
  suggestions: string[]
}

interface GetRecommendationsOptions {
  name: string
  isAuthenticated?: boolean
}

export const getRecommendations = async ({
  name,
  isAuthenticated = false,
}: GetRecommendationsOptions): Promise<RecommendationsResult> => {
  try {
    const normalizedName = normalizeName(name).replace('.eth', '')
    const fetchFunction = isAuthenticated ? authFetch : fetch
    const response = await fetchFunction(`${API_URL}/ai-recommendations/${encodeURIComponent(normalizedName)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (response.status === 401) {
      return { status: 'login_required', suggestions: [] }
    }

    if (!response.ok) {
      return { status: 'error', suggestions: [] }
    }

    const data = (await response.json()) as APIResponseType<{ suggestions: string[] }>
    const suggestions = (data.data?.suggestions || [])
      .map((suggestion) => normalizeName(suggestion).replace('.eth', ''))
      .filter((suggestion) => suggestion.length > 0)

    return { status: suggestions.length > 0 ? 'ready' : 'empty', suggestions }
  } catch (error) {
    console.error('Failed to fetch AI recommendations:', error)
    return { status: 'error', suggestions: [] }
  }
}
