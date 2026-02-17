import { authFetch } from '@/api/authFetch'
import { parseCookie } from '@/api/authFetch/utils/parseCookie'
import { API_URL } from '@/constants/api'
import { normalizeName } from '@/lib/ens'
import { APIResponseType } from '@/types/api'

type AIRecommendationsPayload = {
  suggestions?: string[]
}

export type AIRecommendationsResult =
  | { status: 'ready'; suggestions: string[] }
  | { status: 'empty'; suggestions: [] }
  | { status: 'login_required'; suggestions: [] }
  | { status: 'error'; suggestions: [] }

const getHasAuthToken = () => {
  if (typeof document === 'undefined' || !document.cookie) {
    return false
  }

  const cookies = parseCookie(document.cookie)
  return Boolean(cookies?.token)
}

const normalizeSuggestion = (value: string) => {
  return normalizeName(value).replace(/\.eth$/i, '')
}

export const getRecommendations = async (name: string): Promise<AIRecommendationsResult> => {
  try {
    const normalizedName = normalizeName(name).replace(/\.eth$/i, '')
    const fetchFunction = getHasAuthToken() ? authFetch : fetch
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

    if (response.status === 400) {
      return { status: 'empty', suggestions: [] }
    }

    if (!response.ok) {
      return { status: 'error', suggestions: [] }
    }

    const data = (await response.json()) as APIResponseType<AIRecommendationsPayload>
    if (!data.success) {
      return { status: 'error', suggestions: [] }
    }

    const suggestions = (data.data?.suggestions || []).map(normalizeSuggestion).filter((suggestion) => suggestion.length > 0)
    if (suggestions.length === 0) {
      return { status: 'empty', suggestions: [] }
    }

    return { status: 'ready', suggestions }
  } catch (error) {
    console.error('Failed to fetch AI recommendations:', error)
    return { status: 'error', suggestions: [] }
  }
}
