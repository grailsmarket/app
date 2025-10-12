import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'

export const removeFromWatchlist = async (watchlistId: number) => {
  const response = await authFetch(`${API_URL}/watchlist/${watchlistId}`, {
    method: 'DELETE',
    mode: 'cors',
  })

  const json = (await response.json()) as APIResponseType<null>
  return {
    success: json.success,
    watchlistId,
  }
}
