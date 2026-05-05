'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectExpiringDomainsConfig } from '@/state/reducers/dashboard/selectors'
import { useUserContext } from '@/context/user'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { beautifyName } from '@/lib/ens'
import LoadingCell from '@/components/ui/loadingCell'
import { cn } from '@/utils/tailwind'
import type { NameFilters } from '@/types/filters/name'

interface ExpiringDomainsWidgetProps {
  instanceId: string
}

const FILTERS: NameFilters = {
  ...emptyFilterState,
  status: ['Grace'],
  sort: 'expiry_date_asc',
}

const ExpiringDomainsWidget: React.FC<ExpiringDomainsWidgetProps> = ({ instanceId }) => {
  const config = useAppSelector((state) => selectExpiringDomainsConfig(state, instanceId))
  const { userAddress, authStatus } = useUserContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
    queryKey: ['dashboard', 'expiring-domains', userAddress],
    queryFn: async ({ pageParam = 1 }) => {
      if (!userAddress) throw new Error('No user')
      return fetchDomains({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        filters: FILTERS,
        searchTerm: '',
        ownerAddress: userAddress,
        isAuthenticated: authStatus === 'authenticated',
      })
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!userAddress && authStatus === 'authenticated',
  })

  const domains = useMemo(() => data?.pages?.flatMap((p) => p.domains) ?? [], [data])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (!config) return null

  if (authStatus !== 'authenticated' || !userAddress) {
    return (
      <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
        Sign in to see your expiring names.
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto'>
        {isLoading && domains.length === 0 ? (
          <div className='divide-tertiary divide-y'>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className='flex items-center justify-between px-3 py-2'>
                <LoadingCell width='140px' height='18px' />
                <LoadingCell width='80px' height='14px' />
              </div>
            ))}
          </div>
        ) : domains.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
            No names in grace period.
          </div>
        ) : (
          <div className='divide-tertiary divide-y'>
            {domains.map((d) => (
              <Link
                key={d.name}
                href={`/${encodeURIComponent(d.name)}`}
                className='hover:bg-secondary flex items-center justify-between px-3 py-2 transition-colors'
              >
                <span className='truncate text-sm font-medium'>{beautifyName(d.name)}</span>
                <span className={cn('shrink-0 text-xs', 'text-grace')}>
                  {d.expiry_date ? formatExpiryDate(d.expiry_date) : 'Grace'}
                </span>
              </Link>
            ))}
            {isFetchingNextPage && (
              <div className='flex items-center justify-center py-3'>
                <div className='border-primary h-4 w-4 animate-spin rounded-full border-b-2' />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ExpiringDomainsWidget
