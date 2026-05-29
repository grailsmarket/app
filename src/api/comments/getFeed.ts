import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { CommentFeedResponse } from '@/types/comment'
import { authFetch } from '../authFetch'

interface GetCommentFeedParams {
  owner?: string
  clubs?: string[]
  page?: number
  limit?: number
  watchlist?: boolean
}

export const getCommentFeed = async ({
  owner,
  clubs = [],
  page = 1,
  limit = 20,
  watchlist = false,
}: GetCommentFeedParams) => {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(limit))
  if (owner) params.set('owner', owner)
  if (clubs.length > 0) params.set('clubs', clubs.join(','))
  if (watchlist) params.set('watchlist', 'true')

  const response = await authFetch(`${API_URL}/comments/feed?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch comments feed: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<CommentFeedResponse>
  return json.data
}
