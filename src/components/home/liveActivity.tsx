'use client'

import { useState, useEffect, useRef } from 'react'
import Activity from '../activity'
import { NameActivityType } from '@/types/domains'
import { fetchAllActivity } from '@/api/activity/all'
import { useInfiniteQuery } from '@tanstack/react-query'
import { API_URL } from '@/constants/api'
import useScrollToBottom from '@/hooks/useScrollToBottom'
import { useWindowSize } from 'ethereum-identity-kit'

const LiveActivity = () => {
  const [liveActivities, setLiveActivities] = useState<NameActivityType[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const isAtBottom = useScrollToBottom({ threshold: 20, enabled: true })
  const { width: windowWidth } = useWindowSize()

  useEffect(() => {
    const baseUrl = API_URL.replace(/\/api\/v1$/, '')
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')

    const ws = new WebSocket(`${wsUrl}/ws/activity`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Activity WebSocket connected')
      setIsConnected(true)

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
      setIsConnected(false)
    }

    ws.onclose = () => {
      console.log('Activity WebSocket disconnected')
      setIsConnected(false)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe_all' }))
      }
      ws.close()
    }
  }, [])

  const {
    data: fetchHistoricalActivityData,
    isLoading: isLoadingHistoricalActivities,
    isFetchingNextPage: isFetchingNextPageHistoricalActivities,
    fetchNextPage: fetchNextPageHistoricalActivities,
    hasNextPage: hasNextPageHistoricalActivities,
  } = useInfiniteQuery({
    queryKey: ['all', 'activity'],
    queryFn: async ({ pageParam = 1 }) => {
      const activities = await fetchAllActivity({
        limit: 30,
        pageParam,
        eventTypes: ['listed', 'bought', 'sold', 'offer_made', 'offer_accepted', 'offer_cancelled', 'listing_cancelled'],
      })
      return activities
    },
    getNextPageParam: (lastPage) => (lastPage.hasNextPage ? lastPage.nextPageParam : undefined),
    initialPageParam: 1,
  })

  const historicalActivities = fetchHistoricalActivityData?.pages.flatMap((page) => page.activity) || []
  const allActivities = [...liveActivities, ...historicalActivities]
  const isActivityLoading = isLoadingHistoricalActivities || isFetchingNextPageHistoricalActivities

  return (
    <div className='bg-secondary p-lg border-primary mx-auto w-full max-w-7xl rounded-lg border-2 pb-0'>
      <div className='p-sm sm:p-lg py-md sm:py-lg mb-1 flex items-center justify-between'>
        <h2 className='text-2xl font-bold text-white sm:text-3xl'>Live Activity</h2>
        <div className='flex items-center justify-end gap-1 sm:gap-2'>
          <div
            className={`h-2.5 w-2.5 animate-pulse rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          ></div>
          <span className='text-md text-right font-medium sm:text-lg'>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Live Activity Section */}
      <Activity
        maxHeight={windowWidth && windowWidth < 1536 ? 'calc(100vh - 220px)' : 'calc(1000px - 68px)'}
        activity={allActivities}
        paddingBottom='10px'
        loadingRowCount={16}
        isLoading={isLoadingHistoricalActivities || isFetchingNextPageHistoricalActivities}
        noResults={!isActivityLoading && allActivities.length === 0}
        fetchMoreActivity={fetchNextPageHistoricalActivities}
        hasMoreActivity={hasNextPageHistoricalActivities}
        scrollEnabled={isAtBottom}
      />
    </div>
  )
}

export default LiveActivity
