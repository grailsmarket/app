import { MarketplaceDomainType, WatchlistItemType } from '@/types/domains'
import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'

export const addToWatchlist = async ({ domain, listId }: { domain: MarketplaceDomainType; listId?: number }) => {
  const response = await authFetch(`${API_URL}/watchlist`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ensName: domain.name,
      notifyOnSale: true,
      notifyOnOffer: true,
      notifyOnListing: true,
      notifyOnPriceChange: false,
      ...(listId ? { listId } : {}),
      notifyOnComment: false,
    }),
  })

  const data = (await response.json()) as APIResponseType<WatchlistItemType & { listId?: number }>
  return {
    domain: {
      ...domain,
      watchlist_record_id: data.data.id,
    },
    listId: data.data.listId,
    response: data.data,
  }
}
