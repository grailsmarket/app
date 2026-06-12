'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchAllActivity } from '@/api/activity/all'
import { API_URL } from '@/constants/api'
import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'
import type { ActivityTypeFilterType } from '@/types/filters/activity'
import type { ActivityType } from '@/types/profile'

const PAGE_SIZE = 20
// Live buffer holds only events matching every active filter (see onmessage),
// so this caps matching events, never unfiltered noise.
const MAX_LIVE_ACTIVITIES = 50
const ALL_ACTIVITY_TYPES = ACTIVITY_TYPE_FILTERS.map((filter) => filter.value)

interface UseFeedActivityParams {
  eventTypes: ActivityTypeFilterType[]
  clubs?: string[]
  platform?: string
  minPriceWei?: string
  maxPriceWei?: string
  watchlist?: boolean
  userAddress?: string
  authStatus?: string
  enabled?: boolean
}

export const useFeedActivity = ({
  eventTypes,
  clubs = [],
  platform,
  minPriceWei,
  maxPriceWei,
  watchlist = false,
  userAddress,
  authStatus,
  enabled = true,
}: UseFeedActivityParams) => {
  const [liveActivities, setLiveActivities] = useState<ActivityType[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    setLiveActivities([])
  }, [eventTypes, clubs, platform, minPriceWei, maxPriceWei, watchlist, enabled])

  useEffect(() => {
    if (!enabled || watchlist) return

    const baseUrl = API_URL.replace(/\/api\/v1$/, '')
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    const ws = new WebSocket(`${wsUrl}/ws/activity`)
    wsRef.current = ws

    const sendFilter = () => {
      // The activity socket only supports event-type and price filters server-side.
      // platform and clubs have no socket message type, so they are applied
      // client-side in onmessage below (before the buffer cap).
      ws.send(
        JSON.stringify({
          type: 'set_event_filter',
          filter_type: 'include',
          event_types: eventTypes.length > 0 ? eventTypes : ALL_ACTIVITY_TYPES,
        })
      )

      if (minPriceWei || maxPriceWei) {
        ws.send(
          JSON.stringify({
            type: 'set_price_filter',
            min_price_wei: minPriceWei,
            max_price_wei: maxPriceWei,
          })
        )
      }
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe_all' }))
      sendFilter()
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (message.type !== 'activity_event') return

        const activity = message.data as ActivityType
        // Filter before the buffer cap so non-matching events never take a slot and
        // starve out a minority platform/club the socket can't filter server-side.
        if (eventTypes.length > 0 && !eventTypes.includes(activity.event_type as ActivityTypeFilterType)) return
        if (platform && activity.platform?.toLowerCase() !== platform) return
        if (clubs.length > 0 && !clubs.some((club) => activity.clubs?.includes(club))) return

        setLiveActivities((prev) => {
          const next = [activity, ...prev.filter((item) => item.id !== activity.id)]
          return next.slice(0, MAX_LIVE_ACTIVITIES)
        })
      } catch (error) {
        console.error('Error parsing activity websocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.log('Activity WebSocket error:', error)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe_all' }))
      }
      ws.close()
    }
  }, [eventTypes, clubs, platform, minPriceWei, maxPriceWei, watchlist, enabled])

  const query = useInfiniteQuery({
    queryKey: [
      'feed',
      'activity',
      eventTypes,
      clubs,
      platform ?? null,
      minPriceWei ?? null,
      maxPriceWei ?? null,
      watchlist,
      userAddress ?? null,
      authStatus ?? null,
    ],
    queryFn: ({ pageParam }) =>
      fetchAllActivity({
        limit: PAGE_SIZE,
        pageParam,
        eventTypes,
        categories: clubs.length > 0 ? clubs.join(',') : undefined,
        platform,
        minPriceWei,
        maxPriceWei,
        watchlist,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    staleTime: 15_000,
    enabled: enabled && (!watchlist || authStatus === 'authenticated'),
  })

  const historicalActivities = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.activity) ?? []
  }, [query.data])

  const activities = useMemo(() => {
    const seen = new Set<number>()
    return [...liveActivities, ...historicalActivities].filter((activity) => {
      if (seen.has(activity.id)) return false
      seen.add(activity.id)
      return true
    })
  }, [liveActivities, historicalActivities])

  return {
    ...query,
    activities,
  }
}
