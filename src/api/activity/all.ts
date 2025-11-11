import { API_URL } from '@/constants/api'
import { ActivityTypeFilterType } from '@/state/reducers/filters/profileActivityFilters'
import { APIResponseType, PaginationType } from '@/types/api'
import { ActivityType } from '@/types/profile'

interface FetchAllActivityOptions {
  limit: number
  pageParam: number
  eventTypes: ActivityTypeFilterType[]
}

export const fetchAllActivity = async ({ limit, pageParam, eventTypes }: FetchAllActivityOptions) => {
  const typeFilter = eventTypes.join('&event_type=')
  const response = await fetch(`${API_URL}/activity?limit=${limit}&page=${pageParam}&event_type=${typeFilter}`)
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
