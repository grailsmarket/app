import { API_URL } from '@/constants/api'
import { normalizeName } from '@/lib/ens'
import { APIResponseType, PaginationType } from '@/types/api'
import { ActivityType } from '@/types/profile'

interface FetchNameActivityOptions {
  name: string
  limit: number
  pageParam: number
}

export const fetchNameActivity = async ({ name, limit, pageParam }: FetchNameActivityOptions) => {
  const response = await fetch(`${API_URL}/activity/${normalizeName(name)}?limit=${limit}&page=${pageParam}`)
  const data = (await response.json()) as APIResponseType<{
    results: ActivityType[]
    pagination: PaginationType
  }>

  return {
    activity: data.data.results,
    nextPageParam: data.data.pagination.page + 1,
    hasNextPage: data.data.pagination.hasNext,
  }
}
