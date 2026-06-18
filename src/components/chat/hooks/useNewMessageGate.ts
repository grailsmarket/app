'use client'

import { useRef } from 'react'
import type { ChatMessage } from '@/types/chat'

/**
 * Returns a predicate reporting whether a message arrived *after* the thread was
 * first loaded — i.e. a live message received while the chat is open, as opposed
 * to the history shown on open or older pages fetched on scroll-up.
 *
 * It works off a high-water mark: the newest `created_at` present once the first
 * load settles (`isReady`). Anything strictly newer than that came in live.
 * Comparing server timestamps to each other (never to the client clock) keeps it
 * immune to clock skew. An empty chat seeds the mark at 0 so its very first
 * incoming message still animates. `resetKey` (the chat id) clears the mark when
 * the conversation changes, so switching chats never animates the next thread's
 * history.
 */
export const useNewMessageGate = (messages: ChatMessage[], resetKey: string | undefined, isReady: boolean) => {
  const highWater = useRef<number | null>(null)
  const key = useRef(resetKey)

  // Drop the mark when the conversation changes so it re-establishes below.
  if (key.current !== resetKey) {
    key.current = resetKey
    highWater.current = null
  }

  // Seed once the first load settles; idempotent on later renders. An empty
  // thread yields 0, so any real message that follows reads as live.
  if (highWater.current === null && isReady) {
    let max = 0
    for (const m of messages) {
      const t = new Date(m.created_at).getTime()
      if (t > max) max = t
    }
    highWater.current = max
  }

  const mark = highWater.current
  return (message: ChatMessage) => mark !== null && new Date(message.created_at).getTime() > mark
}
