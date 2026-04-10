'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
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
import { Check, ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'

const EVENT_TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
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

  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const eventDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsEventDropdownOpen(false)
  })

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryDropdownOpen(false)
  })

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
      <div className='border-tertiary flex flex-wrap items-center border-b'>
        {/* Connection indicator */}
        {/* <div className={cn('mx-4 h-2 w-2 shrink-0 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} /> */}

        {/* Event type filters */}
        <div ref={eventDropdownRef} className='border-tertiary relative w-1/2'>
          <button
            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>
              {config.eventTypes.length === 0
                ? 'All'
                : config.eventTypes
                    .map((type) => EVENT_TYPE_OPTIONS.find((opt) => opt.value === type)?.label)
                    .join(', ')}
            </p>
            <ShortArrow
              className={cn('h-3 w-3 transition-transform', isEventDropdownOpen ? 'rotate-0' : 'rotate-180')}
            />
          </button>
          {isEventDropdownOpen && (
            <div className='bg-background border-tertiary absolute top-11 left-0 z-10 flex w-full flex-col rounded-md border-2 shadow-lg'>
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (opt.value === 'all') {
                      dispatch(updateComponentConfig({ id: instanceId, patch: { eventTypes: [] } }))
                      setIsEventDropdownOpen(false)
                    } else {
                      toggleEventType(opt.value)
                    }
                  }}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{opt.label}</p>
                  {config.eventTypes.includes(opt.value) && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category selector */}
        <div ref={categoryDropdownRef} className='border-tertiary relative w-1/2 border-l-2'>
          <button
            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-42 truncate text-lg'>{config.category ?? 'All Categories'}</p>
            <ShortArrow
              className={cn('h-3 w-3 transition-transform', isCategoryDropdownOpen ? 'rotate-0' : 'rotate-180')}
            />
          </button>
          {isCategoryDropdownOpen && (
            <div className='bg-background border-tertiary absolute top-11 left-0 z-10 flex w-full flex-col rounded-md border-2 shadow-lg'>
              <button
                key='all'
                onClick={() => {
                  dispatch(updateComponentConfig({ id: instanceId, patch: { category: null } }))
                  setIsCategoryDropdownOpen(false)
                }}
                className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
              >
                <p>All Categories</p>
              </button>
              {categories?.map((cat: any) => (
                <button
                  key={cat.name ?? cat}
                  value={cat.name ?? cat}
                  onChange={(e) => setCategory(e.target.value || null)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{cat.name ?? cat}</p>
                  {config.category === (cat.name ?? cat) && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
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
