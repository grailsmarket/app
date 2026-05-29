'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useCommentFeed } from '@/hooks/comments/useCommentFeed'
import { useFeedScrollLock } from '@/hooks/comments/useFeedScrollLock'
import { useFeedViewport } from '@/hooks/comments/useFeedViewport'
import { useOwnerAddressLookup } from '@/hooks/comments/useOwnerAddressLookup'
import { useFeedActivity } from '@/hooks/activity/useFeedActivity'
import { cn } from '@/utils/tailwind'
import FeedFilters from './feedFilters'
import type { FeedTab } from './feedFilters'
import FeedCommentCard from './feedCommentCard'
import FeedActivityCard from './feedActivityCard'
import ActivityTypeSidebar from './activityTypeSidebar'
import type { FeedPlatformFilter } from './activityTypeSidebar'
import ReplyPreview from './replyPreview'
import FeedComposer from './feedComposer'
import FeedLoading from './feedLoading'
import type { ReplyContext } from './types'
import type { ActivityTypeFilterType } from '@/types/filters/activity'
import { ACTIVITY_TYPE_FILTERS } from '@/constants/filters/activity'
import { parseEther } from 'viem'

const TRENDING_ACTIVITY_TYPES = ['registration', 'sale', 'offer'] as ActivityTypeFilterType[]
const TRENDING_ACTIVITY_FILTERS = ACTIVITY_TYPE_FILTERS.filter((filter) =>
  TRENDING_ACTIVITY_TYPES.includes(filter.value)
)
const TRENDING_MIN_WEI = '100000000000000000'

const ethToWei = (value: string) => {
  if (!value) return undefined

  try {
    return parseEther(value).toString()
  } catch {
    return undefined
  }
}

type FeedItem =
  | {
      type: 'comment'
      id: string
      timestamp: string
      data: NonNullable<ReturnType<typeof useCommentFeed>['comments'][number]>
    }
  | { type: 'activity'; id: string; timestamp: string; data: ReturnType<typeof useFeedActivity>['activities'][number] }

const CommentsFeed: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<FeedTab>('all')
  const [ownerInput, setOwnerInput] = useState('')
  const [selectedClubs, setSelectedClubs] = useState<string[]>([])
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<ActivityTypeFilterType[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<FeedPlatformFilter>('all')
  const [minPriceEth, setMinPriceEth] = useState('')
  const [maxPriceEth, setMaxPriceEth] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSeenNewestId = useRef<string | null>(null)
  const isLoadingOlder = useRef(false)

  const { ownerAddress, ownerEnsName, oppositeIdentifier, ownerError } = useOwnerAddressLookup(ownerInput)
  const showComments = selectedTab !== 'activity'
  const showActivity = selectedTab !== 'comments'
  const showCommentFilters = selectedTab !== 'activity'
  const showActivityFilters = selectedTab !== 'comments'
  const isTrending = selectedTab === 'trending'
  const isWatchlist = selectedTab === 'watchlist'
  const visibleActivityTypeFilters = isTrending ? TRENDING_ACTIVITY_FILTERS : ACTIVITY_TYPE_FILTERS
  const activityEventTypes = useMemo(
    () =>
      isTrending
        ? selectedActivityTypes.length > 0
          ? selectedActivityTypes.filter((type) => TRENDING_ACTIVITY_TYPES.includes(type))
          : TRENDING_ACTIVITY_TYPES
        : selectedActivityTypes,
    [isTrending, selectedActivityTypes]
  )
  const activityPlatform = selectedPlatform === 'all' ? undefined : selectedPlatform
  const selectedMinPriceWei = ethToWei(minPriceEth)
  const selectedMaxPriceWei = ethToWei(maxPriceEth)
  const minPriceWei = selectedMinPriceWei ?? (isTrending ? TRENDING_MIN_WEI : undefined)

  const { comments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCommentFeed({
    owner: ownerAddress,
    clubs: selectedClubs,
    watchlist: isWatchlist,
    enabled: showComments,
  })
  const {
    activities,
    isLoading: isActivityLoading,
    isFetchingNextPage: isFetchingNextActivityPage,
    hasNextPage: hasNextActivityPage,
    fetchNextPage: fetchNextActivityPage,
  } = useFeedActivity({
    eventTypes: activityEventTypes,
    clubs: selectedClubs,
    platform: activityPlatform,
    minPriceWei,
    maxPriceWei: selectedMaxPriceWei,
    watchlist: isWatchlist,
    enabled: showActivity,
  })

  const feedItems = useMemo<FeedItem[]>(() => {
    return [
      ...(showComments ? comments : []).map((comment) => ({
        type: 'comment' as const,
        id: comment.id,
        timestamp: comment.created_at,
        data: comment,
      })),
      ...(showActivity ? activities : []).map((activity) => ({
        type: 'activity' as const,
        id: String(activity.id),
        timestamp: activity.created_at,
        data: activity,
      })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [activities, comments, showActivity, showComments])

  useFeedScrollLock()
  const { viewport, viewportStyle } = useFeedViewport()
  const isInitialLoading = isLoading || isActivityLoading
  const isFetchingMore = isFetchingNextPage || isFetchingNextActivityPage
  const hasMore = !!hasNextPage || !!hasNextActivityPage

  const selectedFilterCount =
    selectedClubs.length +
    (ownerInput && showCommentFilters ? 1 : 0) +
    (selectedPlatform !== 'all' && showActivityFilters ? 1 : 0) +
    (minPriceEth && showActivityFilters ? 1 : 0) +
    (maxPriceEth && showActivityFilters ? 1 : 0) +
    (showActivityFilters ? selectedActivityTypes.length : 0)
  const canClearFilters = selectedFilterCount > 0

  useEffect(() => {
    if (!isTrending) return
    setSelectedActivityTypes((current) => current.filter((type) => TRENDING_ACTIVITY_TYPES.includes(type)))
  }, [isTrending])

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
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        selectedFilterCount={selectedFilterCount}
        onToggleFilters={() => setIsFiltersOpen((isOpen) => !isOpen)}
      />

      <div className='relative flex min-h-0 flex-1 flex-col lg:flex-row'>
        <ActivityTypeSidebar
          isOpen={isFiltersOpen}
          selectedTypes={selectedActivityTypes}
          onToggleType={toggleActivityType}
          activityTypeFilters={visibleActivityTypeFilters}
          showCommentFilters={showCommentFilters}
          showActivityFilters={showActivityFilters}
          ownerInput={ownerInput}
          onOwnerInputChange={setOwnerInput}
          ownerName={ownerEnsName}
          oppositeIdentifier={oppositeIdentifier}
          ownerError={ownerError}
          selectedClubs={selectedClubs}
          onSelectedClubsChange={setSelectedClubs}
          platform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          minPriceEth={minPriceEth}
          maxPriceEth={maxPriceEth}
          onMinPriceEthChange={setMinPriceEth}
          onMaxPriceEthChange={setMaxPriceEth}
          canClear={canClearFilters}
          onClear={() => {
            setOwnerInput('')
            setSelectedClubs([])
            setSelectedActivityTypes([])
            setSelectedPlatform('all')
            setMinPriceEth('')
            setMaxPriceEth('')
          }}
          onClose={() => setIsFiltersOpen(false)}
        />
        {isFiltersOpen && (
          <button
            type='button'
            aria-label='Close filters'
            onClick={() => setIsFiltersOpen(false)}
            className='absolute inset-0 z-30 cursor-default bg-black/20 md:hidden'
          />
        )}
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
