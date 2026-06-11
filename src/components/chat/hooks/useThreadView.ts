import { useUserContext } from '@/context/user'
import { ChatMessage } from '@/types/chat'
import { useEffect, useRef, useState } from 'react'

interface UseThreadViewParams {
  messages: ChatMessage[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  disableAutoScroll?: boolean
}

export const useThreadView = ({ messages, hasNextPage, isFetchingNextPage, fetchNextPage }: UseThreadViewParams) => {
  const { userAddress } = useUserContext()
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false)
  // Auto-scroll to bottom on new messages.
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSeenCount = useRef(0)
  const hasScrolledToBottom = useRef(false)
  const lastSeenNewestMessageId = useRef<string | null>(null)
  useEffect(() => {
    if (!scrollRef.current) return

    const isLastMessageNewest = messages[messages.length - 1]?.id === lastSeenNewestMessageId.current
    if (isLastMessageNewest) {
      lastSeenNewestMessageId.current = messages[messages.length - 1]?.id
    }

    const isMyMessage =
      isLastMessageNewest && messages[messages.length - 1]?.sender_address?.toLowerCase() === userAddress?.toLowerCase()
    // We should scroll to bottom if the newest message was sent by the user
    // or when the user is near the bottom of the thread and the newest message is from someone else
    if (hasScrolledToBottom.current && !isScrolledToBottom && !isMyMessage) return

    if (messages.length > lastSeenCount.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      hasScrolledToBottom.current = true
    }

    lastSeenCount.current = messages.length
  }, [messages.length, isScrolledToBottom])

  // Adjust for the virtual keyboard along with keeping the latest message visible
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    let previousHeight = vv.height
    let pinning = false

    const KEYBOARD_REVEAL_THRESHOLD = 80
    const PIN_DURATION_MS = 350

    const pinToBottom = () => {
      if (pinning) return
      pinning = true
      const start = performance.now()
      const tick = () => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
        if (performance.now() - start < PIN_DURATION_MS) {
          requestAnimationFrame(tick)
        } else {
          pinning = false
        }
      }
      requestAnimationFrame(tick)
    }

    const onResize = () => {
      const nextHeight = vv.height
      if (nextHeight < previousHeight - KEYBOARD_REVEAL_THRESHOLD) {
        pinToBottom()
      }
      previousHeight = nextHeight
    }

    vv.addEventListener('resize', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
    }
  }, [])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const t = e.currentTarget

    if (t.scrollTop < 200 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }

    if (t.scrollTop >= t.scrollHeight - t.clientHeight - 60) {
      setIsScrolledToBottom(true)
    } else {
      setIsScrolledToBottom(false)
    }
  }

  return {
    scrollRef,
    handleScroll,
  }
}
