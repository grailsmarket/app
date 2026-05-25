'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { CommentFeedItem } from '@/types/comment'

interface UseFeedScrollParams {
  scrollRef: RefObject<HTMLDivElement | null>
  comments: CommentFeedItem[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}

export const useFeedScroll = ({
  scrollRef,
  comments,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseFeedScrollParams) => {
  const lastSeenNewestId = useRef<string | null>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el || comments.length === 0) return

    const newest = comments[comments.length - 1]
    if (lastSeenNewestId.current !== newest.id) {
      el.scrollTop = el.scrollHeight
      lastSeenNewestId.current = newest.id
    }
  }, [comments, scrollRef])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    let previousHeight = vv.height
    let pinning = false

    const pinToBottom = () => {
      if (pinning) return
      pinning = true
      const start = performance.now()
      const tick = () => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
        if (performance.now() - start < 350) requestAnimationFrame(tick)
        else pinning = false
      }
      requestAnimationFrame(tick)
    }

    const onResize = () => {
      if (vv.height < previousHeight - 80) pinToBottom()
      previousHeight = vv.height
    }

    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [scrollRef])

  const loadOlder = async () => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const previousHeight = el.scrollHeight
    await fetchNextPage()
    requestAnimationFrame(() => {
      const nextEl = scrollRef.current
      if (!nextEl) return
      nextEl.scrollTop = nextEl.scrollHeight - previousHeight + nextEl.scrollTop
    })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 200) loadOlder()
  }

  return { loadOlder, handleScroll }
}
