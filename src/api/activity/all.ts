import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { ActivityTypeFilterType } from '@/types/filters/activity'
import { ActivityType } from '@/types/profile'

interface FetchAllActivityOptions {
  limit: number
  pageParam: number
  eventTypes: ActivityTypeFilterType[]
  categories?: string
}

export const fetchAllActivity = async ({ limit, pageParam, eventTypes, categories }: FetchAllActivityOptions) => {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  params.set('page', String(pageParam))
  eventTypes.forEach((eventType) => params.append('event_type', eventType))
  if (categories) params.set('club', categories)

  const response = await fetch(`${API_URL}/activity?${params.toString()}`)
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
