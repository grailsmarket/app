import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'

export type WatchlistSettingsType = {
  notifyOnSale: boolean
  notifyOnOffer: boolean
  notifyOnListing: boolean
  notifyOnPriceChange: boolean
}

export const updateWatchlistSettings = async ({
  watchlistId,
  settings,
}: {
  watchlistId: number
  settings: WatchlistSettingsType
}) => {
  const response = await authFetch(`${API_URL}/watchlist/${watchlistId}`, {
    method: 'PATCH',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  })

  const json = (await response.json()) as APIResponseType<{
    id: number
    notifyOnSale: boolean
    notifyOnOffer: boolean
    notifyOnListing: boolean
    notifyOnPriceChange: boolean
  }>

  return json.success
}
