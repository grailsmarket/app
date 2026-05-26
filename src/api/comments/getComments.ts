import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { CommentsResponse } from '@/types/comment'
import { authFetch } from '../authFetch'

interface GetCommentsParams {
  name?: string | null
  cursor?: string
  limit?: number
  categories?: string[]
  authorAddress?: string | null
}

export const getComments = async ({
  name,
  cursor,
  limit = 50,
  categories = [],
  authorAddress,
}: GetCommentsParams): Promise<CommentsResponse> => {
  const params = new URLSearchParams()
  if (name) params.set('name', name)
  params.set('limit', String(limit))
  if (cursor) params.set('cursor', cursor)
  if (authorAddress) params.set('author_address', authorAddress)
  categories.forEach((category) => params.append('clubs[]', category))

  const response = await authFetch(`${API_URL}/comments?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<CommentsResponse>
  return json.data
}
