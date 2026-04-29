import { API_URL } from '@/constants/api'
import { authFetch } from '../../authFetch'
import { APIResponseType } from '@/types/api'
import { WatchlistListType } from '@/types/domains'

export type CreateWatchlistListError = 'LIST_LIMIT_REACHED' | 'DUPLICATE_LIST_NAME'

export const createWatchlistList = async (name: string): Promise<WatchlistListType> => {
  try {
    const response = await authFetch(`${API_URL}/watchlist/lists`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    const data = (await response.json()) as APIResponseType<WatchlistListType> & { code?: CreateWatchlistListError }

    if (!response.ok || !data.success) {
      const error = new Error(data.code || 'Failed to create watchlist list') as Error & {
        code?: CreateWatchlistListError
      }
      error.code = data.code
      throw error
    }

    return data.data
  } catch (error) {
    console.error('Error creating watchlist list', error)
    throw error
  }
}
