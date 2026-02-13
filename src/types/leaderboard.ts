export interface LeaderboardUser {
  address: `0x${string}`
  names_owned: number
  names_in_clubs: number
  expired_names: number
  names_listed: number
  clubs: string[]
}

export interface LeaderboardResponse {
  success: boolean
  data: {
    users: LeaderboardUser[]
  }
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  meta: {
    timestamp: string
    version: string
    filters: { clubs?: string[] }
    sort: { by: string; order: string }
  }
}

export type LeaderboardSortBy = 'names_owned' | 'names_in_clubs' | 'expired_names' | 'names_listed'
export type LeaderboardSortOrder = 'asc' | 'desc'

export interface LeaderboardFilters {
  sortBy: LeaderboardSortBy
  sortOrder: LeaderboardSortOrder
  clubs: string[]
}
