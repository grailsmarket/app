'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { API_URL } from '@/constants/api'
import { useUserContext } from '@/context/user'
import { useAppDispatch } from '@/state/hooks'
import { setTyping, clearTyping, clearAllTyping } from '@/state/reducers/chat/typing'
import { parseCookie } from '@/api/authFetch/utils/parseCookie'
import { setChatSocket } from './socketSingleton'
import type {
  ChatMessagesResponse,
  ChatInboxResponse,
  ChatWSEvent,
  ChatWSOutgoing,
} from '@/types/chat'

const TYPING_TTL_MS = 4000
const PING_INTERVAL_MS = 25_000
const RECONNECT_DELAYS_MS = [1_000, 2_000, 5_000, 15_000, 30_000]

const buildWsUrl = (token: string): string => {
  const baseHttp = API_URL.replace(/\/api\/v1$/, '')
  const baseWs = baseHttp.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
  return `${baseWs}/ws/chats?token=${encodeURIComponent(token)}`
}

/**
 * Mounts once at the providers level (gated by auth) and keeps a single
 * WebSocket open for the lifetime of the authed session. Patches React Query
 * caches and Redux typing state on incoming events.
 *
 * Reconnects with exponential backoff (capped at 30s) on unexpected close.
 */
export const useChatSocket = () => {
  const { userAddress, authStatus } = useUserContext()
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempt = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const intentionalCloseRef = useRef(false)

  useEffect(() => {
    if (!userAddress || authStatus !== 'authenticated') return

    const cookies = typeof document === 'undefined' ? {} : parseCookie(document.cookie)
    const token = cookies?.token
    if (!token) return

    intentionalCloseRef.current = false
    let mounted = true

    const send = (msg: ChatWSOutgoing) => {
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg))
      }
    }

    const clearTypingTimer = (key: string) => {
      const t = typingTimers.current.get(key)
      if (t) {
        clearTimeout(t)
        typingTimers.current.delete(key)
      }
    }

    const handleEvent = (evt: ChatWSEvent) => {
      switch (evt.type) {
        case 'connected':
          // Server-confirmed; subscribe immediately for delivery.
          send({ type: 'subscribe' })
          return

        case 'subscribed':
        case 'unsubscribed':
        case 'pong':
          return

        case 'error':
          console.warn('[chat ws] server error:', evt.message)
          return

        case 'chat:message_new': {
          const { chat_id, message } = evt.data
          const senderIsMe = message.sender_address?.toLowerCase() === userAddress.toLowerCase()
          // Patch messages cache. Three cases to handle:
          // 1. Canonical id already present (POST onSuccess won the race) → no-op.
          // 2. Sender is me AND an optimistic placeholder with matching body is
          //    still in cache (WS won the race) → REPLACE in place rather than
          //    appending, otherwise the optimistic + canonical both stick around
          //    and the message renders twice until the next refresh.
          // 3. Otherwise → prepend to the newest page.
          queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
            ['chats', chat_id, 'messages'],
            (old) => {
              if (!old) return old
              const exists = old.pages.some((p) => p.messages.some((m) => m.id === message.id))
              if (exists) return old

              if (senderIsMe) {
                let replaced = false
                const updatedPages = old.pages.map((page) => {
                  if (replaced) return page
                  const idx = page.messages.findIndex(
                    (m) =>
                      m.id.startsWith('optimistic-') &&
                      m.body === message.body &&
                      !m.deleted_at
                  )
                  if (idx === -1) return page
                  replaced = true
                  const next = [...page.messages]
                  next[idx] = message
                  return { ...page, messages: next }
                })
                if (replaced) return { ...old, pages: updatedPages }
              }

              const [first, ...rest] = old.pages
              return {
                ...old,
                pages: [{ ...first, messages: [message, ...first.messages] }, ...rest],
              }
            }
          )
          // Patch inbox: bump last_message + last_message_at + unread (unless sender is me).
          queryClient.setQueryData<InfiniteData<ChatInboxResponse>>(['chats', 'inbox'], (old) => {
            if (!old) return old
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                chats: page.chats.map((c) =>
                  c.id === chat_id
                    ? {
                        ...c,
                        last_message: message,
                        last_message_at: message.created_at,
                        unread_count: senderIsMe ? c.unread_count ?? 0 : (c.unread_count ?? 0) + 1,
                      }
                    : c
                ),
              })),
            }
          })
          // The chat may not yet be in the inbox cache (e.g. brand-new direct chat
          // initiated by the other party). Refetch lazily.
          queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
          return
        }

        case 'chat:message_deleted': {
          const { chat_id, message_id } = evt.data
          queryClient.setQueryData<InfiniteData<ChatMessagesResponse>>(
            ['chats', chat_id, 'messages'],
            (old) => {
              if (!old) return old
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map((m) =>
                    m.id === message_id ? { ...m, body: null, deleted_at: new Date().toISOString() } : m
                  ),
                })),
              }
            }
          )
          return
        }

        case 'chat:read': {
          const { chat_id } = evt.data
          // Refetch chat detail so the participants array reflects the new read pointer.
          queryClient.invalidateQueries({ queryKey: ['chats', chat_id, 'detail'] })
          return
        }

        case 'chat:typing': {
          const { chat_id, user_id } = evt.data
          if (user_id === -1) return
          const key = `${chat_id}:${user_id}`
          clearTypingTimer(key)
          dispatch(setTyping({ chatId: chat_id, userId: user_id }))
          const timer = setTimeout(() => {
            dispatch(clearTyping({ chatId: chat_id, userId: user_id }))
            typingTimers.current.delete(key)
          }, TYPING_TTL_MS)
          typingTimers.current.set(key, timer)
          return
        }

        case 'chat:typing_stop': {
          const { chat_id, user_id } = evt.data
          const key = `${chat_id}:${user_id}`
          clearTypingTimer(key)
          dispatch(clearTyping({ chatId: chat_id, userId: user_id }))
          return
        }

        case 'chat:created': {
          queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
          return
        }
      }
    }

    const connect = () => {
      if (!mounted) return
      const ws = new WebSocket(buildWsUrl(token))
      wsRef.current = ws

      ws.onopen = () => {
        reconnectAttempt.current = 0
        setChatSocket(ws)
        // Subscribe is sent on `connected` event below, after the server confirms auth.
        if (pingTimer.current) clearInterval(pingTimer.current)
        pingTimer.current = setInterval(() => send({ type: 'ping' }), PING_INTERVAL_MS)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ChatWSEvent
          handleEvent(data)
        } catch (error) {
          console.warn('[chat ws] bad message', error)
        }
      }

      ws.onerror = () => {
        // onclose will follow; reconnect handled there.
      }

      ws.onclose = (event) => {
        if (pingTimer.current) {
          clearInterval(pingTimer.current)
          pingTimer.current = null
        }
        wsRef.current = null
        setChatSocket(null)
        // Drop typing state — stale on reconnect.
        dispatch(clearAllTyping())
        for (const t of typingTimers.current.values()) clearTimeout(t)
        typingTimers.current.clear()

        if (intentionalCloseRef.current || event.code === 4401) {
          // 4401 = unauthorized: stop trying so we don't hammer with a bad token.
          return
        }

        const idx = Math.min(reconnectAttempt.current, RECONNECT_DELAYS_MS.length - 1)
        const delay = RECONNECT_DELAYS_MS[idx]
        reconnectAttempt.current += 1
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      mounted = false
      intentionalCloseRef.current = true
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (pingTimer.current) clearInterval(pingTimer.current)
      for (const t of typingTimers.current.values()) clearTimeout(t)
      typingTimers.current.clear()
      const ws = wsRef.current
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe' }))
      }
      ws?.close()
      wsRef.current = null
      setChatSocket(null)
      dispatch(clearAllTyping())
    }
  }, [userAddress, authStatus, queryClient, dispatch])
}
