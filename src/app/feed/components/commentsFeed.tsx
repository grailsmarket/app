'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useCommentFeed } from '@/hooks/comments/useCommentFeed'
import { useFeedScrollLock } from '@/hooks/comments/useFeedScrollLock'
import { useFeedViewport } from '@/hooks/comments/useFeedViewport'
import { useOwnerAddressLookup } from '@/hooks/comments/useOwnerAddressLookup'
import { useFeedActivity } from '@/hooks/activity/useFeedActivity'
import { cn } from '@/utils/tailwind'
import FeedFilters from './feedFilters'
import FeedCommentCard from './feedCommentCard'
import FeedActivityCard from './feedActivityCard'
import ActivityTypeSidebar from './activityTypeSidebar'
import ReplyPreview from './replyPreview'
import FeedComposer from './feedComposer'
import FeedLoading from './feedLoading'
import type { ReplyContext } from './types'
import type { ActivityTypeFilterType } from '@/types/filters/activity'

type FeedItem =
  | {
      type: 'comment'
      id: string
      timestamp: string
      data: NonNullable<ReturnType<typeof useCommentFeed>['comments'][number]>
    }
  | { type: 'activity'; id: string; timestamp: string; data: ReturnType<typeof useFeedActivity>['activities'][number] }

const CommentsFeed: React.FC = () => {
  const [ownerInput, setOwnerInput] = useState('')
  const [selectedClubs, setSelectedClubs] = useState<string[]>([])
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<ActivityTypeFilterType[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSeenNewestId = useRef<string | null>(null)
  const isLoadingOlder = useRef(false)

  const { ownerAddress, ownerEnsName, oppositeIdentifier, ownerError } = useOwnerAddressLookup(ownerInput)
  const { comments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCommentFeed({
    owner: ownerAddress,
    clubs: selectedClubs,
  })
  const {
    activities,
    isLoading: isActivityLoading,
    isFetchingNextPage: isFetchingNextActivityPage,
    hasNextPage: hasNextActivityPage,
    fetchNextPage: fetchNextActivityPage,
  } = useFeedActivity({ eventTypes: selectedActivityTypes })

  const feedItems = useMemo<FeedItem[]>(() => {
    return [
      ...comments.map((comment) => ({
        type: 'comment' as const,
        id: comment.id,
        timestamp: comment.created_at,
        data: comment,
      })),
      ...activities.map((activity) => ({
        type: 'activity' as const,
        id: String(activity.id),
        timestamp: activity.created_at,
        data: activity,
      })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [activities, comments])

  useFeedScrollLock()
  const { viewport, viewportStyle } = useFeedViewport()
  const isInitialLoading = isLoading || isActivityLoading
  const isFetchingMore = isFetchingNextPage || isFetchingNextActivityPage
  const hasMore = !!hasNextPage || !!hasNextActivityPage

  useEffect(() => {
    const el = scrollRef.current
    if (!el || feedItems.length === 0 || isLoadingOlder.current) return

    const newest = feedItems[feedItems.length - 1]
    if (lastSeenNewestId.current !== newest.id) {
      el.scrollTop = el.scrollHeight
      lastSeenNewestId.current = newest.id
    }
  }, [feedItems])

  const loadMore = async () => {
    const el = scrollRef.current
    if (isFetchingMore) return
    const previousHeight = el?.scrollHeight ?? 0
    isLoadingOlder.current = true

    await Promise.all([
      hasNextPage ? fetchNextPage() : Promise.resolve(),
      hasNextActivityPage ? fetchNextActivityPage() : Promise.resolve(),
    ])

    requestAnimationFrame(() => {
      const nextEl = scrollRef.current
      if (nextEl) nextEl.scrollTop = nextEl.scrollHeight - previousHeight + nextEl.scrollTop
      isLoadingOlder.current = false
    })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 200) loadMore()
  }

  const toggleActivityType = (type: ActivityTypeFilterType) => {
    setSelectedActivityTypes((current) =>
      current.includes(type) ? current.filter((selectedType) => selectedType !== type) : [...current, type]
    )
  }

  return (
    <div
      style={viewportStyle}
      className={cn(
        'fixed right-0 left-0 mx-auto flex h-[calc(100dvh-54px)] w-full flex-col transition-[height,top] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] md:h-[calc(100dvh-70px)]',
        viewport ? '' : 'top-[54px] md:top-[70px]'
      )}
    >
      <FeedFilters
        ownerInput={ownerInput}
        onOwnerInputChange={setOwnerInput}
        ownerName={ownerEnsName}
        oppositeIdentifier={oppositeIdentifier}
        ownerError={ownerError}
        selectedClubs={selectedClubs}
        onSelectedClubsChange={setSelectedClubs}
      />

      <div className='relative flex min-h-0 flex-1 flex-col lg:flex-row'>
        <ActivityTypeSidebar
          selectedTypes={selectedActivityTypes}
          onToggleType={toggleActivityType}
          onClear={() => setSelectedActivityTypes([])}
        />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className='h-full min-h-0 w-full flex-1 overflow-y-auto py-4'
          onClick={() => {
            if (replyContext) {
              setReplyContext(null)
              setSelectedName(null)
            }
          }}
        >
          <div className='mx-auto max-w-5xl px-3 sm:px-5'>
            {isInitialLoading ? (
              <FeedLoading />
            ) : feedItems.length === 0 ? (
              <div className='flex h-full min-h-[280px] items-center justify-center text-center'>
                <p className='text-neutral text-lg'>No feed events found for these filters.</p>
              </div>
            ) : (
              <div
                className={cn(
                  'flex flex-col gap-3 transition-all duration-200',
                  replyContext && 'pointer-events-none opacity-40 blur-[2px] select-none'
                )}
              >
                {isFetchingMore && <FeedLoading count={3} />}
                {hasMore && !isFetchingMore && (
                  <button type='button' onClick={loadMore} className='text-primary py-2 text-sm font-semibold'>
                    Load older feed events
                  </button>
                )}
                {feedItems.map((item) =>
                  item.type === 'comment' ? (
                    <FeedCommentCard
                      key={`comment-${item.id}`}
                      comment={item.data}
                      onReply={(context) => {
                        setSelectedName(context.name)
                        setReplyContext(context)
                      }}
                    />
                  ) : (
                    <FeedActivityCard
                      key={`activity-${item.id}`}
                      activity={item.data}
                      onReply={(name) => {
                        setSelectedName(name)
                        setReplyContext(null)
                      }}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {replyContext && (
          <ReplyPreview
            context={replyContext}
            onClear={() => {
              setSelectedName(null)
              setReplyContext(null)
            }}
          />
        )}
      </div>

      <FeedComposer
        selectedName={selectedName}
        onSubmitSuccess={() => setReplyContext(null)}
        onSelectedNameChange={(name) => {
          setSelectedName(name)
          setReplyContext(null)
        }}
      />
    </div>
  )
}

export default CommentsFeed
