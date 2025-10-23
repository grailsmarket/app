import { API_URL } from '@/constants/api'
import { PaginationType } from '@/types/api'
import { ProfileActivityType } from '@/types/profile'
import { Address } from 'viem'

interface FetchProfileActivityOptions {
  address: Address
  limit: number
  pageParam: number
}

export const fetchProfileActivity = async ({ address, limit, pageParam }: FetchProfileActivityOptions) => {
  const response = await fetch(`${API_URL}/activity/address/${address}?limit=${limit}&page=${pageParam}`)
  const data = (await response.json()) as {
    data: ProfileActivityType[]
    pagination: PaginationType
  }

  return {
    activity: data.data,
    nextPageParam: data.pagination.page + 1,
    hasNextPage: data.pagination.hasNext,
  }
}
