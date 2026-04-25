'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectWatchlistConfig } from '@/state/reducers/dashboard/selectors'
import { useWatchlistDomains } from '@/app/profile/[user]/hooks/useWatchlistDomains'
import { useUserContext } from '@/context/user'
import Card from '@/components/domains/grid/components/card'
import LoadingCard from '@/components/domains/grid/components/loadingCard'
import TableRow from '@/components/domains/table/components/TableRow'
import { MarketplaceHeaderColumn } from '@/types/domains'
import { PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'
import grid from 'public/icons/grid.svg'
import list from 'public/icons/list.svg'

interface WatchlistWidgetProps {
  instanceId: string
}

const getListColumns = (width: number): MarketplaceHeaderColumn[] => {
  if (width < 400) return ['domain', 'actions']
  if (width < 600) return ['domain', 'price', 'actions']
  if (width < 800) return ['domain', 'price', 'expires', 'actions']
  return PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS
}

const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectWatchlistConfig(state, instanceId))
  const { userAddress, authStatus } = useUserContext()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const {
    watchlistDomains,
    isWatchlistDomainsLoading,
    isWatchlistDomainsFetchingNextPage,
    fetchMoreWatchlistDomains,
    hasMoreWatchlistDomains,
    totalWatchlistDomains,
  } = useWatchlistDomains(userAddress)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const listColumns = useMemo(() => getListColumns(containerWidth), [containerWidth])

  const domains = useMemo(
    () => watchlistDomains?.pages?.flatMap((page) => page.domains) ?? [],
    [watchlistDomains]
  )

  const displayedDomains = useMemo(
    () => [...domains, ...Array(isWatchlistDomainsFetchingNextPage ? 18 : 0).fill(null)],
    [domains, isWatchlistDomainsFetchingNextPage]
  )

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasMoreWatchlistDomains) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
      fetchMoreWatchlistDomains()
    }
  }, [hasMoreWatchlistDomains, fetchMoreWatchlistDomains])

  const handleViewToggle = useCallback(() => {
    if (!config) return
    dispatch(
      updateComponentConfig({
        id: instanceId,
        patch: { viewType: config.viewType === 'grid' ? 'list' : 'grid' },
      })
    )
  }, [dispatch, instanceId, config])

  if (!config) return null

  const isAuthed = authStatus === 'authenticated' && !!userAddress

  return (
    <div className='flex h-full flex-col'>
      <div className='border-tertiary flex items-center justify-between border-b px-3'>
        <p className='text-neutral text-sm'>
          {isAuthed ? `${totalWatchlistDomains} ${totalWatchlistDomains === 1 ? 'name' : 'names'}` : 'Not signed in'}
        </p>
        <button
          onClick={handleViewToggle}
          className='hover:bg-secondary flex h-10 w-10 cursor-pointer items-center justify-center p-1 transition-colors'
          title={config.viewType === 'grid' ? 'Switch to list' : 'Switch to grid'}
        >
          <Image
            src={config.viewType === 'grid' ? grid : list}
            alt='View'
            width={config.viewType === 'grid' ? 20 : 26}
            height={config.viewType === 'grid' ? 20 : 26}
          />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className={cn('flex-1 overflow-y-auto p-2', config.viewType === 'list' && 'p-0')}
      >
        {!isAuthed ? (
          <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
            Sign in to view your watchlist.
          </div>
        ) : isWatchlistDomainsLoading && domains.length === 0 ? (
          <div className='grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2'>
            {Array.from({ length: 8 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : domains.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>Your watchlist is empty.</div>
        ) : config.viewType === 'grid' ? (
          <div className='grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2'>
            {displayedDomains.map((domain, index) =>
              domain ? (
                <Card key={domain.name} domain={domain} index={index} allDomains={domains} />
              ) : (
                <LoadingCard key={index} />
              )
            )}
          </div>
        ) : (
          <div className='divide-tertiary divide-y text-sm'>
            {displayedDomains.map((domain, index) =>
              domain ? (
                <TableRow
                  key={domain.name}
                  domain={domain}
                  index={index}
                  allDomains={domains}
                  displayedColumns={listColumns}
                />
              ) : (
                <LoadingCard key={index} />
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WatchlistWidget
