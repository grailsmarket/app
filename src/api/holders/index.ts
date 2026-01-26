import { API_BASE_URL } from '@/constants/analytics'

export interface Holder {
  address: `0x${string}`
  name_count: number
}

export interface HoldersResponse {
  success: boolean
  data: {
    clubs: string[]
    unique_holders: number
    holders: Holder[]
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta: {
    timestamp: string
  }
}

interface FetchHoldersParams {
  category: string
  page?: number
  limit?: number
}

export const fetchHolders = async ({
  category,
  page = 1,
  limit = 20,
}: FetchHoldersParams): Promise<HoldersResponse> => {
  const params = new URLSearchParams({
    sortOrder: 'desc',
    page: String(page),
    limit: String(limit),
  })

  const response = await fetch(`${API_BASE_URL}/clubs/${category}/holders?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch holders')
  }

  return response.json()
}
