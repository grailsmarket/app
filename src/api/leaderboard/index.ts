import { API_BASE_URL } from '@/constants/analytics'
import { LeaderboardResponse, LeaderboardSortBy, LeaderboardSortOrder } from '@/types/leaderboard'

interface FetchLeaderboardParams {
  page?: number
  limit?: number
  sortBy?: LeaderboardSortBy
  sortOrder?: LeaderboardSortOrder
  clubs?: string[]
}

export const fetchLeaderboard = async ({
  page = 1,
  limit = 20,
  sortBy = 'names_owned',
  sortOrder = 'desc',
  clubs = [],
}: FetchLeaderboardParams = {}): Promise<LeaderboardResponse> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  })

  // Add clubs as array params
  clubs.forEach((club) => {
    params.append('clubs[]', club)
  })

  const response = await fetch(`${API_BASE_URL}/leaderboard?${params}`)

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard')
  }

  return response.json()
}
