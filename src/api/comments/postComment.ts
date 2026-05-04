import { API_URL } from '@/constants/api'
import type { PostCommentResponse } from '@/types/comment'
import { authFetch } from '../authFetch'

export interface PostCommentError {
  status: number
  code: string
  message: string
  details?: unknown
}

interface PostCommentApiResponse {
  data: PostCommentResponse
  success: boolean
  error?: {
    code: string
    message: string
    details?: unknown
  }
}

export const postComment = async ({ name, body }: { name: string; body: string }): Promise<PostCommentResponse> => {
  const response = await authFetch(`${API_URL}/comments`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, body }),
  })

  const json = (await response.json()) as PostCommentApiResponse

  if (!response.ok || !json.success) {
    const err: PostCommentError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to post comment',
      details: json.error?.details,
    }
    throw err
  }

  return json.data
}
