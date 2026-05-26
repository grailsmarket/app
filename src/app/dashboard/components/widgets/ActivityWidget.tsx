'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import type { ActivityColumnType, NameActivityType } from '@/types/domains'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'
import ActivityRow from '@/components/activity/components/activityRow'

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

const ALL_COLUMNS: ActivityColumnType[] = ['event', 'name', 'price', 'user']

// Pick how many columns to render based on the widget's measured width.
// Mirrors the breakpoint progression used by the Activity page (index.tsx)
// but reads container width instead of viewport.
const columnsForWidth = (width: number): ActivityColumnType[] => {
  if (width === 0) return ALL_COLUMNS
  if (width < 360) return ALL_COLUMNS.slice(0, 2)
  if (width < 560) return ALL_COLUMNS.slice(0, 3)
  return ALL_COLUMNS
}

// NameActivityType (from the live WebSocket feed) is a subset of ActivityType.
// ActivityRow expects the richer ActivityType, so we backfill the missing
// fields with empty defaults.
const toActivityType = (event: NameActivityType | ActivityType): ActivityType => ({
  id: event.id,
  name: event.name,
  ens_name_id: 'ens_name_id' in event ? event.ens_name_id : 0,
  event_type: event.event_type,
  actor_address: event.actor_address,
  counterparty_address: event.counterparty_address,
  platform: event.platform,
  chain_id: event.chain_id,
  price_wei: event.price_wei,
  currency_address: event.currency_address,
  transaction_hash: event.transaction_hash,
  block_number: event.block_number,
  created_at: event.created_at,
  price: 'price' in event ? event.price : null,
  token_id: event.token_id ?? '',
  clubs: 'clubs' in event ? event.clubs : [],
  metadata: 'metadata' in event ? event.metadata : {},
})

interface ActivityWidgetProps {
  instanceId: string
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectActivityConfig(state, instanceId))
  const { events: liveEvents, isConnected } = useDashboardActivity(instanceId)
  const { categories } = useCategories()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false)
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)

  const eventDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsEventDropdownOpen(false)
  })

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryDropdownOpen(false)
  })

  // Track widget width to choose column set. ActivityRow itself adapts its
  // internal layout via container queries, so this only controls how many
  // columns we ask the row to render.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const displayedColumns = useMemo(() => columnsForWidth(containerWidth), [containerWidth])

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

  const allEvents = useMemo(() => {
    return [...liveEvents, ...historicalEvents].map(toActivityType)
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
      setIsCategoryDropdownOpen(false)
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      {/* Filters */}
      <div className='border-tertiary flex flex-wrap items-center border-b'>
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
                onClick={() => setCategory(null)}
                className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
              >
                <p>All Categories</p>
                {config.category === null && <Check className='text-primary h-4 w-4' />}
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{cat.name}</p>
                  {config.category === cat.name && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Events list */}
      <div ref={scrollRef} onScroll={handleScroll} className='@container flex-1 overflow-y-auto'>
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
          allEvents.map((activity, index) => (
            <ActivityRow
              key={`${activity.transaction_hash ?? activity.id}-${index}`}
              activity={activity}
              displayedColumns={displayedColumns}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default ActivityWidget
