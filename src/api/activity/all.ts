import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { ActivityTypeFilterType } from '@/types/filters/activity'
import { ActivityType } from '@/types/profile'

interface FetchAllActivityOptions {
  limit: number
  pageParam: number
  eventTypes: ActivityTypeFilterType[]
  categories?: string
  platform?: string
  weiAmount?: string
  watchlist?: boolean
}

export const fetchAllActivity = async ({
  limit,
  pageParam,
  eventTypes,
  categories,
  platform,
  weiAmount,
  watchlist = false,
}: FetchAllActivityOptions) => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('page', String(pageParam))
  eventTypes.forEach((eventType) => params.append('event_type', eventType))
  if (categories) params.set('club', categories)
  if (platform) params.set('platform', platform)
  if (weiAmount) params.set('wei_amount', weiAmount)

  const response = await fetch(`${API_URL}/activity${watchlist ? '/watchlist' : ''}?${params.toString()}`)
  const data = (await response.json()) as APIResponseType<{
    results: ActivityType[]
    pagination: PaginationType
  }>

  if (!data.data.results) {
    return {
      activity: [],
      nextPageParam: pageParam,
      hasNextPage: false,
    }
  }

  return {
    activity: data.data.results,
    nextPageParam: data.data.pagination.page + 1,
    hasNextPage: data.data.pagination.hasNext,
  }
}
