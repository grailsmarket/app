import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { WatchlistEntryType } from '@/types/domains'

export const checkWatchlist = async (name: string) => {
  const response = await authFetch(`${API_URL}/watchlist/check/${name}`)
  const data = (await response.json()) as APIResponseType<{
    isWatching: boolean
    watchlistEntry: WatchlistEntryType
  }>

  return data.data
}
