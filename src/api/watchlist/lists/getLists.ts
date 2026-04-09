import { API_URL } from '@/constants/api'
import { authFetch } from '../../authFetch'
import { APIResponseType } from '@/types/api'
import { WatchlistListType } from '@/types/domains'

export const getWatchlistLists = async (): Promise<WatchlistListType[]> => {
  try {
    const response = await authFetch(`${API_URL}/watchlist/lists`)

    if (!response.ok) {
      throw new Error('Failed to fetch watchlist lists')
    }

    const data = (await response.json()) as APIResponseType<{ lists: WatchlistListType[] }>
    return data.data.lists
  } catch (error) {
    console.error('Error fetching watchlist lists', error)
    throw error
  }
}
