import { API_URL } from '@/constants/api'
import { authFetch } from '../../authFetch'
import { APIResponseType } from '@/types/api'

export type DeleteWatchlistListError = 'CANNOT_DELETE_DEFAULT'

export const deleteWatchlistList = async (listId: number): Promise<{ success: boolean; listId: number }> => {
  try {
    const response = await authFetch(`${API_URL}/watchlist/lists/${listId}`, {
      method: 'DELETE',
      mode: 'cors',
    })

    const data = (await response.json()) as APIResponseType<null> & { code?: DeleteWatchlistListError }

    if (!response.ok || !data.success) {
      const error = new Error(data.code || 'Failed to delete watchlist list') as Error & {
        code?: DeleteWatchlistListError
      }
      error.code = data.code
      throw error
    }

    return { success: data.success, listId }
  } catch (error) {
    console.error('Error deleting watchlist list', error)
    throw error
  }
}
