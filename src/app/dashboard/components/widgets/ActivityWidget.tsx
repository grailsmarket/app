'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectActivityConfig } from '@/state/reducers/dashboard/selectors'
import { useDashboardActivity } from '../../hooks/useDashboardActivity'
import { fetchAllActivity } from '@/api/activity/all'
import { fetchCategoryActivity } from '@/api/activity/category'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { cn } from '@/utils/tailwind'
import type { ActivityType } from '@/types/profile'

const EVENT_TYPE_OPTIONS = [
  { value: 'listed', label: 'Listed' },
  { value: 'bought', label: 'Bought' },
  { value: 'sold', label: 'Sold' },
  { value: 'mint', label: 'Mint' },
  { value: 'offer_made', label: 'Offer' },
  { value: 'offer_accepted', label: 'Accepted' },
  { value: 'registration', label: 'Register' },
]

interface ActivityWidgetProps {
  instanceId: string
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectActivityConfig(state, instanceId))
  const { events: liveEvents, isConnected } = useDashboardActivity(instanceId)
  const { categories } = useCategories()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Fetch historical activity from API
  const {
    data: historicalData,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['dashboard', 'activity', instanceId, config?.eventTypes, config?.category],
    queryFn: async ({ pageParam = 1 }) => {
      if (!config) throw new Error('No config')

      if (config.category) {
        return fetchCategoryActivity({
          club: config.category,
          limit: DEFAULT_FETCH_LIMIT,
          pageParam,
          eventTypes: config.eventTypes as any[],
        })
      }

      return fetchAllActivity({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        eventTypes: config.eventTypes as any[],
      })
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
    enabled: !!config,
  })

  const historicalEvents = useMemo(
    () => historicalData?.pages?.flatMap((page) => page.activity) ?? [],
    [historicalData]
  )

  // Merge live + historical, live first
  const allEvents = useMemo(() => {
    // Map live events (NameActivityType) to a common shape for display
    const live = liveEvents.map((e) => ({
      id: e.id,
      name: e.name,
      event_type: e.event_type,
      price_wei: e.price_wei,
      transaction_hash: e.transaction_hash,
      created_at: e.created_at,
      isLive: true,
    }))

    const historical = historicalEvents.map((e: ActivityType) => ({
      id: e.id,
      name: e.name,
      event_type: e.event_type,
      price_wei: e.price_wei,
      transaction_hash: e.transaction_hash,
      created_at: e.created_at,
      isLive: false,
    }))

    return [...live, ...historical]
  }, [liveEvents, historicalEvents])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
      fetchNextPage()
    }
  }, [hasNextPage, fetchNextPage])

  const toggleEventType = useCallback(
    (eventType: string) => {
      if (!config) return
      const current = config.eventTypes
      const next = current.includes(eventType) ? current.filter((t) => t !== eventType) : [...current, eventType]
      dispatch(updateComponentConfig({ id: instanceId, patch: { eventTypes: next } }))
    },
    [dispatch, instanceId, config]
  )

  const setCategory = useCallback(
    (category: string | null) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { category } }))
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  const isAllEvents = config.eventTypes.length === 0

  return (
    <div className='flex h-full flex-col'>
      {/* Filters */}
      <div className='border-tertiary flex flex-wrap items-center gap-1.5 border-b px-3 py-2'>
        {/* Connection indicator */}
        <div className={cn('mr-0.5 h-2 w-2 shrink-0 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} />

        {/* Event type filters */}
        <button
          onClick={() => dispatch(updateComponentConfig({ id: instanceId, patch: { eventTypes: [] } }))}
          className={cn(
            'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
            isAllEvents ? 'bg-primary text-background' : 'text-neutral hover:bg-white/10 hover:text-white'
          )}
        >
          All
        </button>
        {EVENT_TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => toggleEventType(opt.value)}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
              config.eventTypes.includes(opt.value)
                ? 'bg-primary text-background'
                : 'text-neutral hover:bg-white/10 hover:text-white'
            )}
          >
            {opt.label}
          </button>
        ))}

        {/* Category selector */}
        <div className='bg-tertiary mx-0.5 h-4 w-px' />
        <select
          value={config.category ?? ''}
          onChange={(e) => setCategory(e.target.value || null)}
          className='border-tertiary bg-secondary cursor-pointer rounded border px-1.5 py-0.5 text-xs outline-none'
        >
          <option value=''>All Categories</option>
          {categories?.map((cat: any) => (
            <option key={cat.name ?? cat} value={cat.name ?? cat}>
              {cat.name ?? cat}
            </option>
          ))}
        </select>
      </div>

      {/* Events list */}
      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto'>
        {isLoading && allEvents.length === 0 ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : allEvents.length === 0 ? (
          <div className='text-neutral flex h-full flex-col items-center justify-center gap-2 text-sm'>
            <p>No activity found</p>
            {!isConnected && <p className='text-xs text-red-400'>Live feed disconnected</p>}
          </div>
        ) : (
          <div className='divide-tertiary divide-y'>
            {allEvents.map((event, i) => (
              <div
                key={`${event.transaction_hash ?? event.id}-${i}`}
                className={cn('flex items-center gap-3 px-3 py-2 text-sm', event.isLive && 'bg-primary/5')}
              >
                <span className='text-primary w-16 shrink-0 text-xs font-medium capitalize'>
                  {event.event_type?.replace('_', ' ')}
                </span>
                <span className='min-w-0 flex-1 truncate font-medium'>{event.name}</span>
                {event.price_wei && Number(event.price_wei) > 0 && (
                  <span className='text-neutral shrink-0 text-xs'>
                    {(Number(event.price_wei) / 1e18).toFixed(4)} ETH
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ActivityWidget
