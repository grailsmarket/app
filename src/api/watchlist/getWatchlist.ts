import { WatchlistItemType } from '@/types/domains'
import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'

export const getWatchlist = async () => {
  const response = await authFetch(`${API_URL}/watchlist`, {
    method: 'GET',
    mode: 'cors',
  })

  const data = (await response.json()) as APIResponseType<{ watchlist: WatchlistItemType[] }>

  return {
    response: data.data,
  }
}
