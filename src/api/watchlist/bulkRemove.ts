import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'

export const bulkRemoveFromWatchlist = async (ids: number[]): Promise<{ removed: number; ids: number[] }> => {
  const response = await authFetch(`${API_URL}/watchlist/bulk`, {
    method: 'DELETE',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  })

  const data = (await response.json()) as APIResponseType<{ removed: number }>
  return { removed: data.data.removed, ids }
}
