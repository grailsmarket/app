'use client'

import React, { useRef, useState } from 'react'
import { useCommentFeed } from '@/hooks/comments/useCommentFeed'
import { useFeedScrollLock } from '@/hooks/comments/useFeedScrollLock'
import { useFeedViewport } from '@/hooks/comments/useFeedViewport'
import { useFeedScroll } from '@/hooks/comments/useFeedScroll'
import { useOwnerAddressLookup } from '@/hooks/comments/useOwnerAddressLookup'
import { cn } from '@/utils/tailwind'
import FeedFilters from './feedFilters'
import FeedCommentCard from './feedCommentCard'
import ReplyPreview from './replyPreview'
import FeedComposer from './feedComposer'
import FeedLoading from './feedLoading'
import type { ReplyContext } from './types'

const CommentsFeed: React.FC = () => {
  const [ownerInput, setOwnerInput] = useState('')
  const [selectedClubs, setSelectedClubs] = useState<string[]>([])
  const [selectedName, setSelectedName] = useState<string | null>(null)
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const { ownerAddress, ownerEnsName, oppositeIdentifier, ownerError } = useOwnerAddressLookup(ownerInput)
  const { comments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCommentFeed({
    owner: ownerAddress,
    clubs: selectedClubs,
  })

  useFeedScrollLock()
  const { viewport, viewportStyle } = useFeedViewport()
  const { loadOlder, handleScroll } = useFeedScroll({
    scrollRef,
    comments,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

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

      <div className='relative min-h-0'>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className='h-full w-full overflow-y-auto py-4'
          onClick={() => {
            if (replyContext) {
              setReplyContext(null)
              setSelectedName(null)
            }
          }}
        >
          <div className='mx-auto max-w-5xl px-3 sm:px-5'>
            {isLoading ? (
              <FeedLoading />
            ) : comments.length === 0 ? (
              <div className='flex h-full min-h-[280px] items-center justify-center text-center'>
                <p className='text-neutral text-lg'>No comments found for these filters.</p>
              </div>
            ) : (
              <div
                className={cn(
                  'flex flex-col gap-3 transition-all duration-200',
                  replyContext && 'pointer-events-none opacity-40 blur-[2px] select-none'
                )}
              >
                {isFetchingNextPage && <FeedLoading count={3} />}
                {hasNextPage && !isFetchingNextPage && (
                  <button type='button' onClick={loadOlder} className='text-primary py-2 text-sm font-semibold'>
                    Load older comments
                  </button>
                )}
                {comments.map((comment) => (
                  <FeedCommentCard
                    key={comment.id}
                    comment={comment}
                    onReply={(context) => {
                      setSelectedName(context.name)
                      setReplyContext(context)
                    }}
                  />
                ))}
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
