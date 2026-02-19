import { Address } from 'viem'

export type MetaType = {
  version?: string
  timestamp: string
}

export type ErrorType = {
  code: string
  message: string
}

export type APIResponseType<T> = {
  data: T
  meta: string
  success: boolean
  error?: {
    code: string
    message: string
  }
}

export type AuthUserType = {
  id: number
  address: string
  email: string | null
  emailVerified: boolean
  telegram: string | null
  discord: string | null
  createdAt: string
  lastSignIn: string
}

export type VerifyResponseType = {
  token: string
  user: AuthUserType
}

export type NonceResponseType = {
  nonce: string
  expiresAt: string
}

export type PaginationType = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export type CreateListingsResultType = {
  index: number
  token_id: string
  order_hash: string
  status: 'failed' | 'success'
  error?: { code: string; message: string }
}

export type BalanceType = {
  symbol: string
  address: Address | null
  wei: string
  formatted: string
  decimals: number
}

export type BalancesResponseType = {
  balances: Record<string, BalanceType>
}

export type BadgeMintType = {
  name: string
  txHash: string
  blockNumber: number
  blockTime: string
  labelhash: string
  namehash: string
}

export type BadgeType = {
  qualified: boolean
  count: number
  mints: BadgeMintType[]
}

export type BadgesResponseType = {
  address: Address
  legends: Record<string, BadgeType>
}

export type MetadataType = {
  label: string
  value: string
  canCopy: boolean
}

export type RolesType = {
  name: string
  owner: Address
  manager: Address
  ethAddress: Address
  isWrapped: boolean
  fuses: null | number
  expiryDate: number
  resolver: Address
}

export interface KeywordMetrics {
  avgMonthlySearches: number | null
  monthlyTrend: { month: string; year: number; searches: number }[]
  relatedKeywordCount: number
  competition: string | null
}
