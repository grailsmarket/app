import { API_URL } from '@/constants/api'
import { APIResponseType, PaginationType } from '@/types/api'
import { DomainOfferType } from '@/types/domains'
import { PortfolioFiltersState } from '@/types/filters'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'

interface FetchReceivedOffersOptions {
  limit: number
  pageParam: number
  filters: PortfolioFiltersState
  ownerAddress: string
  searchTerm: string
}
const fetchReceivedOffers = async ({
  limit,
  pageParam,
  // filters,
  ownerAddress,
  // searchTerm,
}: FetchReceivedOffersOptions) => {
  const paramString = buildQueryParamString({
    limit,
    page: pageParam,
    // q: searchTerm?.length > 0 ? searchTerm.replace('.eth', '') : '',
    // 'filters[expiringWithinDays]': filters.status.includes('Expiring Soon') ? true : false,
    // 'filters[hasNumbers]': filters.type.includes('Numbers') ? true : false,
    // 'filters[hasEmojis]': filters.type.includes('Emojis') ? true : false,
    // sortBy: filters.sort?.replace('_desc', '').replace('_asc', ''),
  })

  const res = await fetch(`${API_URL}/offers/owner/${ownerAddress}?status=pending&${paramString}`)

  const data = (await res.json()) as APIResponseType<{
    offers: DomainOfferType[]
    pagination: PaginationType
  }>
  return {
    offers: data.data.offers,
    nextPageParam: data.data.pagination.page,
    hasNextPage: data.data.pagination.hasNext,
  }
}

export default fetchReceivedOffers
