import { API_URL } from '@/constants/api'
import { authFetch } from '../authFetch'
import { APIResponseType } from '@/types/api'

export type BulkAddWatchlistResult = {
  added: number
  alreadyExisted: number
  notFound: number
}

export const bulkAddToWatchlist = async ({
  ensNames,
  listId,
}: {
  ensNames: string[]
  listId?: number
}): Promise<BulkAddWatchlistResult> => {
  const response = await authFetch(`${API_URL}/watchlist/bulk`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(listId ? { listId, ensNames } : { ensNames }),
  })

  const data = (await response.json()) as APIResponseType<BulkAddWatchlistResult>
  return data.data
}
