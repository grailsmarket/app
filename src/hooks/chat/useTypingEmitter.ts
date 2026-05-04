'use client'

import { useCallback, useEffect, useRef } from 'react'
import { sendChatEvent } from './socketSingleton'

const RESEND_INTERVAL_MS = 1500
const STOP_AFTER_IDLE_MS = 3000

/**
 * Returns helpers to emit typing/stop_typing events for a given chat. Throttles
 * outbound `typing` events to one per RESEND_INTERVAL_MS while the user is
 * actively typing, and auto-fires `stop_typing` after STOP_AFTER_IDLE_MS of silence
 * or on `flush()` (call from send/blur).
 */
export const useTypingEmitter = (chatId: string | null) => {
  const lastSent = useRef(0)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTyping = useRef(false)

  const cancelStop = () => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current)
      stopTimer.current = null
    }
  }

  const flush = useCallback(() => {
    if (!chatId) return
    cancelStop()
    if (isTyping.current) {
      sendChatEvent({ type: 'stop_typing', chat_id: chatId })
      isTyping.current = false
      lastSent.current = 0
    }
  }, [chatId])

  const onChange = useCallback(
    (value: string) => {
      if (!chatId) return
      const now = Date.now()
      if (value.length === 0) {
        flush()
        return
      }
      if (now - lastSent.current > RESEND_INTERVAL_MS) {
        sendChatEvent({ type: 'typing', chat_id: chatId })
        lastSent.current = now
        isTyping.current = true
      }
      cancelStop()
      stopTimer.current = setTimeout(() => {
        if (chatId && isTyping.current) {
          sendChatEvent({ type: 'stop_typing', chat_id: chatId })
          isTyping.current = false
          lastSent.current = 0
        }
      }, STOP_AFTER_IDLE_MS)
    },
    [chatId, flush]
  )

  // Reset on chat change / unmount.
  useEffect(() => {
    return () => {
      flush()
    }
  }, [flush])

  return { onChange, flush }
}
