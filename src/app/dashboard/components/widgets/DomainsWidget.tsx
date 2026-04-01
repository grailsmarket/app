'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  updateComponentConfig,
  updateDomainFilters,
  clearDomainFilters,
  setDomainFiltersOpen,
} from '@/state/reducers/dashboard'
import { selectDomainsConfig } from '@/state/reducers/dashboard/selectors'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useDashboardDomains } from '../../hooks/useDashboardDomains'
import Card from '@/components/domains/grid/components/card'
import LoadingCard from '@/components/domains/grid/components/loadingCard'
import DomainsWidgetFilters from './DomainsWidgetFilters'
import { cn } from '@/utils/tailwind'
import type { SortFilterType } from '@/state/reducers/filters/marketplaceFilters'
import Image from 'next/image'
import filter from 'public/icons/filter.svg'
import { ShortArrow } from 'ethereum-identity-kit'
import { SORT_TYPE_LABELS, SORT_TYPES } from '@/constants/filters/marketplaceFilters'
import { CategoriesPageSortDirection } from '@/constants/filters/categoriesPageFilters'
import grid from 'public/icons/grid.svg'
import list from 'public/icons/list.svg'
import { useClickAway } from '@/hooks/useClickAway'
import ascending from 'public/icons/ascending.svg'
import descending from 'public/icons/descending.svg'

interface DomainsWidgetProps {
  instanceId: string
}

const DomainsWidget: React.FC<DomainsWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectDomainsConfig(state, instanceId))
  const { domains, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useDashboardDomains(instanceId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const [sort, setSort] = useState<string>(config?.filters.sort ?? '')
  const [sortDirection, setSortDirection] = useState<CategoriesPageSortDirection>('desc')

  const dropdownRef = useClickAway<HTMLDivElement>(() => {
    setSortOpen(false)
  })

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage])

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(updateDomainFilters({ id: instanceId, filters: { search: e.target.value } }))
    },
    [dispatch, instanceId]
  )

  const handleSortChange = useCallback(
    (sort: string) => {
      setSort(sort)
      dispatch(updateDomainFilters({ id: instanceId, filters: { sort: `${sort}_${sortDirection}` as SortFilterType } }))
      setSortOpen(false)
    },
    [dispatch, instanceId, sortDirection]
  )

  const handleViewToggle = useCallback(() => {
    if (!config) return
    dispatch(
      updateComponentConfig({
        id: instanceId,
        patch: { viewType: config.viewType === 'grid' ? 'list' : 'grid' },
      })
    )
  }, [dispatch, instanceId, config])

  const toggleFilters = useCallback(() => {
    if (!config) return
    dispatch(setDomainFiltersOpen({ id: instanceId, open: !config.filtersOpen }))
  }, [dispatch, instanceId, config])

  // Count active filters (non-default values)
  const activeFilterCount = useMemo(() => {
    if (!config) return 0
    const f = config.filters
    const d = emptyFilterState
    let count = 0
    if (f.status.length > 0) count++
    if (JSON.stringify(f.market) !== JSON.stringify(d.market)) count++
    if (f.length.min !== null || f.length.max !== null) count++
    if (f.priceRange.min !== null || f.priceRange.max !== null) count++
    if (f.offerRange.min !== null || f.offerRange.max !== null) count++
    if (Object.values(f.textMatch).some((v) => v !== '')) count++
    if (Object.values(f.textNonMatch).some((v) => v !== '')) count++
    return count
  }, [config])

  const displayedDomains = useMemo(() => {
    return [...domains, ...Array(isFetchingNextPage ? 18 : 0).fill(null)]
  }, [domains, isFetchingNextPage])

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      {/* Toolbar */}
      <div className='border-tertiary flex flex-wrap items-center border-b'>
        {/* Filter toggle */}
        <button
          onClick={toggleFilters}
          className={cn(
            'border-tertiary hover:bg-secondary flex h-10 w-10 cursor-pointer items-center justify-center gap-1 border-r text-lg font-medium transition-colors',
            config.filtersOpen && 'bg-primary/10 border-primary/40 text-primary'
          )}
        >
          <Image src={filter} alt='Filter' width={16} height={16} />
        </button>

        {/* Search */}
        <input
          type='text'
          value={config.filters.search}
          onChange={handleSearchChange}
          placeholder='Search names...'
          className='border-tertiary h-10 min-w-0 flex-1 border-r px-2 py-1 text-lg outline-none'
        />

        {/* Sort */}
        <div ref={dropdownRef} className='relative z-30 flex w-64 items-center'>
          <button
            onClick={() => setSortOpen(!sortOpen)}
            className='border-tertiary hover:bg-secondary px-md flex h-10 w-full cursor-pointer flex-row items-center justify-between border-r transition-colors'
          >
            <p className='text-lg font-medium'>
              {SORT_TYPE_LABELS[sort as keyof typeof SORT_TYPE_LABELS] ?? 'Default'}
            </p>
            <ShortArrow className={cn('h-4 w-4 transition-transform', sortOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {sortOpen && (
            <div className='bg-background border-tertiary absolute top-12 left-0 w-55 rounded-md border shadow-lg'>
              {SORT_TYPES.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSortChange(opt)}
                  className='px-lg hover:bg-secondary w-full cursor-pointer py-3 text-left transition-colors'
                >
                  {SORT_TYPE_LABELS[opt as keyof typeof SORT_TYPE_LABELS]}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className='border-tertiary hover:bg-secondary px-md flex h-10 w-10 cursor-pointer flex-row items-center justify-between border-r transition-colors'
          >
            <Image src={sortDirection === 'asc' ? ascending : descending} alt='Sort ascending' width={24} height={24} />
          </button>
        </div>

        {/* View toggle */}
        <button
          onClick={handleViewToggle}
          className='border-tertiary hover:bg-secondary flex h-10 w-10 cursor-pointer items-center justify-center rounded border p-1 transition-colors'
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

      {/* Main area: filter panel + content */}
      <div className='flex min-h-0 flex-1'>
        {/* Filter panel (collapsible side panel) */}
        {config.filtersOpen && (
          <div className='w-64 shrink-0 overflow-y-auto'>
            <DomainsWidgetFilters instanceId={instanceId} filters={config.filters} />
          </div>
        )}

        {/* Content */}
        <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto p-2'>
          {isLoading && domains.length === 0 ? (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2'>
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingCard key={i} />
              ))}
            </div>
          ) : domains.length === 0 ? (
            <div className='text-neutral flex h-full items-center justify-center text-sm'>No domains found</div>
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
                  <div key={domain.name} className='flex items-center gap-3 px-2 py-2'>
                    <span className='min-w-0 flex-1 truncate font-medium'>{domain.name}</span>
                    {domain.listings?.[0] && (
                      <span className='text-neutral shrink-0 text-xs'>
                        {(Number(domain.listings[0].price) / 1e18).toFixed(4)} ETH
                      </span>
                    )}
                  </div>
                ) : (
                  <LoadingCard key={index} />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DomainsWidget
