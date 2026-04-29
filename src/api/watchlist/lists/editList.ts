import { API_URL } from '@/constants/api'
import { authFetch } from '../../authFetch'
import { APIResponseType } from '@/types/api'
import { WatchlistListType } from '@/types/domains'

export type EditWatchlistListError = 'CANNOT_RENAME_DEFAULT' | 'DUPLICATE_LIST_NAME'

export const editWatchlistList = async ({
  listId,
  name,
}: {
  listId: number
  name?: string
}): Promise<WatchlistListType> => {
  try {
    const response = await authFetch(`${API_URL}/watchlist/lists/${listId}`, {
      method: 'PATCH',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    const data = (await response.json()) as APIResponseType<WatchlistListType> & { code?: EditWatchlistListError }

    if (!response.ok || !data.success) {
      const error = new Error(data.code || 'Failed to edit watchlist list') as Error & {
        code?: EditWatchlistListError
      }
      error.code = data.code
      throw error
    }

    return data.data
  } catch (error) {
    console.error('Error editing watchlist list', error)
    throw error
  }
}

export const setDefaultWatchlistList = async (listId: number): Promise<WatchlistListType> => {
  try {
    const response = await authFetch(`${API_URL}/watchlist/lists/${listId}/default`, {
      method: 'PUT',
      mode: 'cors',
    })

    const data = (await response.json()) as APIResponseType<WatchlistListType>

    if (!response.ok || !data.success) {
      throw new Error('Failed to set default watchlist list')
    }

    return data.data
  } catch (error) {
    console.error('Error setting default watchlist list', error)
    throw error
  }
}
