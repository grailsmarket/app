import { authFetch } from '@/api/authFetch'
import { API_STATUS_FILTER_OPTIONS } from '@/api/domains/fetchDomains'
import { API_URL } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { normalizeName } from '@/lib/ens'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import { BigNumber } from '@ethersproject/bignumber'
import Image from 'next/image'
import DownloadIcon from 'public/icons/download-white.svg'
import { Address } from 'viem'
import Tooltip from './tooltip'
import { useState } from 'react'

interface DownloadButtonProps {
  ownerAddress?: Address
  category?: string
}

const DownloadButton = ({ ownerAddress, category }: DownloadButtonProps) => {
  const [isDownloading, setIsDownloading] = useState(false)

  const { authStatus } = useUserContext()
  const { selectors } = useFilterRouter()
  const filters = selectors.filters as MarketplaceFiltersState

  const searchTerm = filters.search
  const search = normalizeName(searchTerm.replace('.eth', '').toLowerCase().trim())
  const statusFilter = filters.status?.filter(
    (status) => API_STATUS_FILTER_OPTIONS[status as keyof typeof API_STATUS_FILTER_OPTIONS]
  )

  const typeFilters = filters.type

  const marketFilters = filters.market
  const getMarketFilterValue = (value: string | undefined): boolean | undefined => {
    if (value === 'yes') return true
    if (value === 'no') return false
    return undefined
  }

  const textMatchFilters = filters.textMatch
  const textNonMatchFilters = filters.textNonMatch
  const getTextMatchFilterValue = (value: string | undefined): string | undefined => {
    return value && value.trim().length > 0 ? value.trim() : undefined
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    const queryParams = buildQueryParamString({
      limit: 10000,
      page: 1,
      q: search?.length > 0 ? search : undefined,
      'filters[owner]': ownerAddress || null,
      'filters[listed]': getMarketFilterValue(filters.market?.Listed),
      'filters[maxLength]': filters.length.max || null,
      'filters[minLength]': filters.length.min || null,
      'filters[maxPrice]': filters.priceRange.max
        ? BigNumber.from(Math.floor(filters.priceRange.max * 10 ** 6))
            .mul(BigNumber.from(10).pow(12))
            .toString()
        : filters.priceRange.max || null,
      'filters[minPrice]': filters.priceRange.min
        ? BigNumber.from(Math.floor(filters.priceRange.min * 10 ** 6))
            .mul(BigNumber.from(10).pow(12))
            .toString()
        : filters.priceRange.min || null,
      'filters[maxOffer]': filters.offerRange?.max
        ? BigNumber.from(Math.floor(filters.offerRange.max * 10 ** 6))
            .mul(BigNumber.from(10).pow(12))
            .toString()
        : filters.offerRange?.max || null,
      'filters[minOffer]': filters.offerRange?.min
        ? BigNumber.from(Math.floor(filters.offerRange.min * 10 ** 6))
            .mul(BigNumber.from(10).pow(12))
            .toString()
        : filters.offerRange?.min || null,
      'filters[letters]': typeFilters.Letters !== 'none' ? typeFilters.Letters : undefined,
      'filters[digits]': typeFilters.Digits !== 'none' ? typeFilters.Digits : undefined,
      'filters[emoji]': typeFilters.Emojis !== 'none' ? typeFilters.Emojis : undefined,
      'filters[repeatingChars]': typeFilters.Repeating !== 'none' ? typeFilters.Repeating : undefined,
      'filters[clubs][]': category || filters.categories?.join(',') || null,
      'filters[status]':
        statusFilter.length === 1
          ? API_STATUS_FILTER_OPTIONS[statusFilter[0] as keyof typeof API_STATUS_FILTER_OPTIONS]
          : undefined,
      'filters[hasSales]': getMarketFilterValue(marketFilters?.['Has Last Sale']),
      'filters[hasOffer]': getMarketFilterValue(marketFilters?.['Has Offers']),
      'filters[marketplace]': marketFilters?.marketplace !== 'none' ? marketFilters?.marketplace : undefined,
      'filters[contains]': getTextMatchFilterValue(textMatchFilters?.Contains),
      'filters[startsWith]': getTextMatchFilterValue(textMatchFilters?.['Starts with']),
      'filters[endsWith]': getTextMatchFilterValue(textMatchFilters?.['Ends with']),
      'filters[doesNotContain]': getTextMatchFilterValue(textNonMatchFilters?.['Does not contain']),
      'filters[doesNotStartWith]': getTextMatchFilterValue(textNonMatchFilters?.['Does not start with']),
      'filters[doesNotEndWith]': getTextMatchFilterValue(textNonMatchFilters?.['Does not end with']),
      sortBy: filters.sort?.replace('_desc', '').replace('_asc', ''),
      sortOrder: filters.sort ? (filters.sort.includes('asc') ? 'asc' : 'desc') : null,
      export: true,
    })

    const response = await authFetch(`${API_URL}/search?${queryParams}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'text/csv',
        'Content-Type': 'text/csv',
      },
    })

    const csv = await response.text()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'domains.csv'
    a.click()
    URL.revokeObjectURL(url)
    setIsDownloading(false)
  }

  return (
    <Tooltip label='Download CSV' padding={0}>
      <button
        disabled={authStatus !== 'authenticated'}
        onClick={handleDownload}
        className='border-foreground flex h-9 w-9 items-center justify-center rounded-sm border opacity-40 transition-opacity hover:opacity-80 disabled:opacity-20 disabled:hover:opacity-20 md:h-10 md:w-10'
      >
        {isDownloading ? (
          <div className='border-foreground inline-block h-5 w-5 animate-spin rounded-full border-r-2 border-b-2'></div>
        ) : (
          <Image src={DownloadIcon} alt='Download' width={20} height={20} />
        )}
      </button>
    </Tooltip>
  )
}

export default DownloadButton
