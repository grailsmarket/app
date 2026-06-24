import { API_URL } from '@/constants/api'
import { APIResponseType, FeedItemType, PaginationType } from '@/types/api'
import { ActivityTypeFilterType } from '@/types/filters/activity'
import { FeedKind } from '@/types/filters/feed'
import { authFetch } from '../authFetch'

export interface FeedRequestError {
  status: number
  code: string
  message: string
}

export const isFeedRequestError = (error: unknown): error is FeedRequestError =>
  typeof error === 'object' && error !== null && 'status' in error && 'code' in error

interface GetFeedParams {
  kinds: FeedKind[]
  owner?: string
  clubs?: string[]
  page?: number
  limit?: number
  watchlist?: boolean
  following?: boolean
  priceRange: {
    min?: string
    max?: string
  }
  eventTypes?: ActivityTypeFilterType[]
  platform?: string
}

export const getFeed = async ({
  kinds,
  owner,
  clubs,
  page,
  limit,
  watchlist,
  following,
  priceRange,
  eventTypes,
  platform,
}: GetFeedParams) => {
  const params = new URLSearchParams()

  const isOnlyComments = kinds.length === 1 && kinds[0] === 'comment'

  if (kinds.length > 0) params.set('kinds', kinds.join(','))
  if (owner) params.set('owner', owner)
  if (clubs?.length) params.set('clubs', clubs.join(','))
  if (page) params.set('page', page.toString())
  if (limit) params.set('limit', limit.toString())
  if (watchlist) params.set('watchlist', 'true')
  if (following) params.set('following', 'true')
  if (!isOnlyComments && priceRange?.min) params.set('min_price_wei', priceRange.min.toString())
  if (!isOnlyComments && priceRange?.max) params.set('max_price_wei', priceRange.max.toString())
  if (!isOnlyComments && eventTypes) params.set('event_type', eventTypes.join(','))
  if (!isOnlyComments && platform) params.set('platform', platform)

  const response = await authFetch(`${API_URL}/feed?${params.toString()}`)

  const json = (await response.json()) as APIResponseType<{
    results: FeedItemType[]
    pagination: PaginationType
  }>

  if (!response.ok) {
    const error: FeedRequestError = {
      status: response.status,
      code: json.error?.code ?? 'UNKNOWN_ERROR',
      message: json.error?.message ?? 'Failed to fetch feed',
    }
    throw error
  }

  return json
}
