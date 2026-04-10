import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'
import { WatchlistCheckListEntry, WatchlistEntryType } from '@/types/domains'

export type CheckWatchlistResponse = {
  isWatching: boolean
  watchlistEntry: WatchlistEntryType
  lists: WatchlistCheckListEntry[]
}

export const checkWatchlist = async (name: string) => {
  const response = await authFetch(`${API_URL}/watchlist/check/${name}`)
  const data = (await response.json()) as APIResponseType<CheckWatchlistResponse>

  return {
    ...data.data,
    lists: data.data.lists ?? [],
  }
}
