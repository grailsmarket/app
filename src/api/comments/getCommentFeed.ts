import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { CommentFeedResponse } from '@/types/comment'
import { authFetch } from '../authFetch'

interface GetCommentFeedParams {
  cursor?: string
  limit?: number
  categories?: string[]
  authorAddress?: string
}

export const getCommentFeed = async ({
  cursor,
  limit = 50,
  categories = [],
  authorAddress,
}: GetCommentFeedParams): Promise<CommentFeedResponse> => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (cursor) params.set('cursor', cursor)
  if (authorAddress) params.set('author_address', authorAddress)
  for (const category of categories) params.append('club', category)

  const response = await authFetch(`${API_URL}/comments/feed?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch comment feed: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<CommentFeedResponse>
  return json.data
}
