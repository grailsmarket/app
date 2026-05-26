'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { API_URL } from '@/constants/api'
import type { NameActivityType } from '@/types/domains'

interface Subscriber {
  eventTypes: string[] // empty = all events
}

interface DashboardActivityContextValue {
  subscribe: (instanceId: string, eventTypes: string[]) => void
  unsubscribe: (instanceId: string) => void
  getEvents: (instanceId: string) => NameActivityType[]
  isConnected: boolean
}

const DashboardActivityContext = createContext<DashboardActivityContextValue | null>(null)

export const useDashboardActivityContext = () => {
  const ctx = useContext(DashboardActivityContext)
  if (!ctx) throw new Error('useDashboardActivityContext must be used within DashboardActivityProvider')
  return ctx
}

const MAX_EVENTS_PER_SUBSCRIBER = 100

export const DashboardActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const wsRef = useRef<WebSocket | null>(null)
  const subscribersRef = useRef<Map<string, Subscriber>>(new Map())
  const eventsRef = useRef<Map<string, NameActivityType[]>>(new Map())
  const [isConnected, setIsConnected] = useState(false)
  const [, forceUpdate] = useState(0)

  const connectWs = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) return

    const baseUrl = API_URL.replace(/\/api\/v1$/, '')
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    const ws = new WebSocket(`${wsUrl}/ws/activity`)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      ws.send(JSON.stringify({ type: 'subscribe_all' }))
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
        if (message.type !== 'activity_event') return

        const activityEvent = message.data as NameActivityType

        // Distribute to subscribers whose filters match
        subscribersRef.current.forEach((sub, id) => {
          const matchesFilter = sub.eventTypes.length === 0 || sub.eventTypes.includes(activityEvent.event_type)
          if (!matchesFilter) return

          const existing = eventsRef.current.get(id) ?? []
          eventsRef.current.set(id, [activityEvent, ...existing].slice(0, MAX_EVENTS_PER_SUBSCRIBER))
        })

        forceUpdate((n) => n + 1)
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => setIsConnected(false)
    ws.onclose = () => {
      setIsConnected(false)
      wsRef.current = null
    }
  }, [])

  const disconnectWs = useCallback(() => {
    const ws = wsRef.current
    if (!ws) return
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'unsubscribe_all' }))
    }
    ws.close()
    wsRef.current = null
  }, [])

  const subscribe = useCallback(
    (instanceId: string, eventTypes: string[]) => {
      subscribersRef.current.set(instanceId, { eventTypes })
      if (!eventsRef.current.has(instanceId)) {
        eventsRef.current.set(instanceId, [])
      }
      // Connect if this is the first subscriber
      if (subscribersRef.current.size === 1) {
        connectWs()
      }
    },
    [connectWs]
  )

  const unsubscribe = useCallback(
    (instanceId: string) => {
      subscribersRef.current.delete(instanceId)
      eventsRef.current.delete(instanceId)
      // Disconnect if no subscribers remain
      if (subscribersRef.current.size === 0) {
        disconnectWs()
      }
    },
    [disconnectWs]
  )

  const getEvents = useCallback((instanceId: string): NameActivityType[] => {
    return eventsRef.current.get(instanceId) ?? []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectWs()
    }
  }, [disconnectWs])

  return (
    <DashboardActivityContext.Provider value={{ subscribe, unsubscribe, getEvents, isConnected }}>
      {children}
    </DashboardActivityContext.Provider>
  )
}
