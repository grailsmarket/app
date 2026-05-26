'use client'

import React, { useEffect, useRef, useState } from 'react'
import FeedCommentCard from '@/app/feed/components/feedCommentCard'
import FeedFilters from '@/app/feed/components/feedFilters'
import FeedLoading from '@/app/feed/components/feedLoading'
import { useCommentFeed } from '@/hooks/comments/useCommentFeed'
import { useOwnerAddressLookup } from '@/hooks/comments/useOwnerAddressLookup'
import { cn } from '@/utils/tailwind'

interface CommentFeedWidgetProps {
  className?: string
}

const CommentFeedWidget: React.FC<CommentFeedWidgetProps> = ({ className }) => {
  const [authorInput, setAuthorInput] = useState('')
  const [selectedClubs, setSelectedClubs] = useState<string[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const {
    ownerAddress: authorAddress,
    ownerEnsName: authorEnsName,
    oppositeIdentifier: authorOppositeIdentifier,
    ownerError: authorError,
  } = useOwnerAddressLookup(authorInput)
  const { comments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCommentFeed({
    author: authorAddress,
    clubs: selectedClubs,
    order: 'page',
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const scrollEl = scrollRef.current
    if (!sentinel || !scrollEl || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { root: scrollEl, rootMargin: '240px' }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const compact = containerWidth > 0 && containerWidth < 560

  return (
    <section
      ref={containerRef}
      className={cn(
        'bg-background border-tertiary flex h-full min-h-[420px] flex-col overflow-hidden rounded-lg border-2',
        className
      )}
    >
      <FeedFilters
        ownerInput={authorInput}
        onOwnerInputChange={setAuthorInput}
        ownerName={authorEnsName}
        oppositeIdentifier={authorOppositeIdentifier}
        ownerError={authorError}
        ownerPlaceholder='Filter commenter by ENS or address'
        compact={compact}
        selectedClubs={selectedClubs}
        onSelectedClubsChange={setSelectedClubs}
      />

      <div ref={scrollRef} className='min-h-0 flex-1 overflow-y-auto py-4'>
        <div className={cn('mx-auto flex max-w-5xl flex-col gap-3 px-3 sm:px-5', compact && 'gap-2 px-2 sm:px-2')}>
          {isLoading ? (
            <FeedLoading />
          ) : comments.length === 0 ? (
            <div className='flex min-h-[280px] items-center justify-center text-center'>
              <p className='text-neutral text-lg'>No comments found for these filters.</p>
            </div>
          ) : (
            <>
              {comments.map((comment) => (
                <FeedCommentCard key={comment.id} comment={comment} compact={compact} />
              ))}
              <div ref={sentinelRef} />
              {isFetchingNextPage && <FeedLoading count={3} />}
              {hasNextPage && !isFetchingNextPage && (
                <button
                  type='button'
                  onClick={() => fetchNextPage()}
                  className='text-primary py-2 text-sm font-semibold'
                >
                  Load more comments
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

export default CommentFeedWidget
