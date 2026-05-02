import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'

export interface DeleteCommentError {
  status: number
  code: string
  message: string
}

interface DeleteCommentResponse {
  data: { id: string; deleted: boolean }
  success: boolean
  error?: { code: string; message: string }
}

export const deleteComment = async ({ id }: { id: string }): Promise<{ id: string }> => {
  const response = await authFetch(`${API_URL}/comments/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })

  const json = (await response.json()) as DeleteCommentResponse

  if (!response.ok || !json.success) {
    const err: DeleteCommentError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to delete comment',
    }
    throw err
  }

  return { id: json.data.id }
}
