import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { CommentsResponse } from '@/types/comment'
import { authFetch } from '../authFetch'

interface GetCommentsParams {
  name: string
  cursor?: string
  limit?: number
}

export const getComments = async ({
  name,
  cursor,
  limit = 50,
}: GetCommentsParams): Promise<CommentsResponse> => {
  const params = new URLSearchParams()
  params.set('name', name)
  params.set('limit', String(limit))
  if (cursor) params.set('cursor', cursor)

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
