import { API_URL } from '@/constants/api'
import type { APIResponseType } from '@/types/api'
import type { CommentQuota } from '@/types/comment'
import { authFetch } from '../authFetch'

export const getCommentQuota = async (): Promise<CommentQuota> => {
  const response = await authFetch(`${API_URL}/comments/quota`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch quota: ${response.status}`)
  }

  const json = (await response.json()) as APIResponseType<CommentQuota>
  return json.data
}
