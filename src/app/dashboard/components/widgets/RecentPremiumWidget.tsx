'use client'

import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LoadingCell } from 'ethereum-identity-kit'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useUserContext } from '@/context/user'
import TableRow from '@/components/domains/table/components/TableRow'
import type { NameFilters } from '@/types/filters/name'
import type { MarketplaceHeaderColumn } from '@/types/domains'
import RecentWidgetHeader from './RecentWidgetHeader'

const ROW_COUNT = 7
const COLUMNS: MarketplaceHeaderColumn[] = ['domain', 'price', 'actions']

// Mirrors the home-page "In Premium" panel: premium status, sorted by watchers,
// excluding pure-digit and emoji names so what shows up reads as words/repeats.
const FILTERS: NameFilters = {
  ...emptyFilterState,
  status: ['Premium'],
  sort: 'watchers_count_desc',
  type: {
    Digits: 'exclude',
    Emojis: 'exclude',
    Repeating: 'include',
    Letters: 'include',
  },
}

const RecentPremiumWidget: React.FC = () => {
  const { authStatus } = useUserContext()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'recent-premium', authStatus],
    queryFn: () =>
      fetchDomains({
        limit: ROW_COUNT,
        pageParam: 1,
        filters: FILTERS,
        searchTerm: '',
        isAuthenticated: authStatus === 'authenticated',
        inAnyCategory: true,
      }),
  })

  const domains = useMemo(() => data?.domains?.slice(0, ROW_COUNT) ?? [], [data])

  return (
    <div className='flex h-full flex-col'>
      <RecentWidgetHeader subtitle='In Premium · most watched' viewAllHref='/marketplace?tab=premium' />
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <SkeletonRows />
        ) : domains.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No premium names</div>
        ) : (
          domains.map((domain, index) => (
            <TableRow
              key={domain.token_id ?? domain.name}
              domain={domain}
              index={index}
              displayedColumns={COLUMNS}
              hideCartIcon
              showWatchlist={false}
            />
          ))
        )}
      </div>
    </div>
  )
}

const SkeletonRows: React.FC = () => (
  <>
    {Array.from({ length: ROW_COUNT }).map((_, i) => (
      <div key={i} className='border-tertiary flex h-[60px] w-full items-center gap-2 border-b px-3'>
        <LoadingCell height='32px' width='32px' radius='4px' />
        <LoadingCell height='14px' width='100px' />
        <div className='flex-1' />
        <LoadingCell height='14px' width='64px' />
      </div>
    ))}
  </>
)

export default RecentPremiumWidget
