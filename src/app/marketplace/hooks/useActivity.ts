import { useMemo, useRef, useState, useEffect } from 'react'
import { API_URL, DEFAULT_FETCH_LIMIT } from '@/constants/api'
import { useDebounce } from '@/hooks/useDebounce'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchAllActivity } from '@/api/activity/all'
import { ActivityType } from '@/types/profile'
import { MarketplaceActivityTypeFilterType } from '@/state/reducers/filters/marketplaceActivityFilters'
import { NameActivityType } from '@/types/domains'

export const useMarketplaceActivity = (setIsLiveActivityConnected: (isConnected: boolean) => void) => {
  const [liveActivities, setLiveActivities] = useState<NameActivityType[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const baseUrl = API_URL.replace(/\/api\/v1$/, '')
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')

    const ws = new WebSocket(`${wsUrl}/ws/activity`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Activity WebSocket connected')
      setIsLiveActivityConnected(true)

      // Subscribe to all activity
      ws.send(
        JSON.stringify({
          type: 'subscribe_all',
        })
      )

      // Exclude sent and receive events
      ws.send(
        JSON.stringify({
          type: 'set_event_filter',
          filter_type: 'exclude',
          event_types: ['sent', 'received'],
        })
      )
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === 'activity_event') {
          // Add new activity to the top of the list
          setLiveActivities((prev) => [message.data, ...prev].slice(0, 50)) // Keep max 50 live events
        } else if (message.type === 'subscribed') {
          console.log('Subscribed to:', message.subscription_type)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.log('WebSocket error:', error)
      setIsLiveActivityConnected(false)
    }

    ws.onclose = () => {
      console.log('Activity WebSocket disconnected')
      setIsLiveActivityConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe_all' }))
      }
      ws.close()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { selectors } = useFilterRouter()
  const filters = selectors.filters
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  const {
    data: activity,
    isLoading,
    isFetchingNextPage,
    fetchNextPage: fetchMoreActivity,
    hasNextPage: hasMoreActivity,
  } = useInfiniteQuery({
    queryKey: ['marketplace', 'activity', debouncedSearch, filters.type],
    queryFn: async ({ pageParam = 1 }) => {
      const results = await fetchAllActivity({
        limit: DEFAULT_FETCH_LIMIT,
        pageParam,
        eventTypes: filters.type as MarketplaceActivityTypeFilterType[],
      })

      return {
        activity: results.activity,
        nextPageParam: results.nextPageParam,
        hasNextPage: results.hasNextPage,
      }
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
  })

  const activityData = useMemo(() => {
    return (
      activity?.pages?.reduce((acc, page) => {
        return [...acc, ...page.activity]
      }, [] as ActivityType[]) || []
    )
  }, [activity])
  const allActivities = useMemo(() => {
    return [...liveActivities, ...activityData]
  }, [liveActivities, activityData])
  const activityLoading = isLoading || isFetchingNextPage

  return {
    activity: allActivities,
    activityLoading,
    fetchMoreActivity,
    hasMoreActivity,
  }
}
