import { API_URL } from '@/constants/api'
import { authFetch } from '@/api/authFetch'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import type { Address } from 'viem'
import type { MarketplaceDomainType } from '@/types/domains'
import type { APIResponseType, PaginationType } from '@/types/api'

interface OwnedNamesParams {
  address: Address
  search: string
  page: number
  signal?: AbortSignal
}

export const fetchOwnedNames = async ({ address, search, page, signal }: OwnedNamesParams) => {
  const params = buildQueryParamString({
    'filters[owner]': address,
    q:
      search
        .trim()
        .toLowerCase()
        .replace(/\.eth$/, '') || undefined,
    limit: 25,
    page,
  })

  const response = await authFetch(`${API_URL}/search?${params}`, { signal })

  if (!response.ok) throw new Error('Could not load your names. Please try again.')

  const result = (await response.json()) as APIResponseType<{
    names?: MarketplaceDomainType[]
    results?: MarketplaceDomainType[]
    pagination: PaginationType
  }>
  const names = result.data?.names ?? result.data?.results

  if (!names || !result.data?.pagination) throw new Error('Could not load your names. Please try again.')

  return {
    names: names.filter((name) => name.owner?.toLowerCase() === address.toLowerCase()),
    nextPage: result.data.pagination.hasNext ? result.data.pagination.page + 1 : undefined,
  }
}
