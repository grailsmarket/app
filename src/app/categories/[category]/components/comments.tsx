'use client'

import React, { useEffect, useRef } from 'react'
import { useComments } from '../hooks/useComments'
import FeedCommentCard from '@/app/feed/components/feedCommentCard'
import FeedLoading from '@/app/feed/components/feedLoading'

interface Props {
  category: string
}

const CommentsPanel: React.FC<Props> = ({ category }) => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useComments(category)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const comments = data?.pages.flatMap((page) => page.results) || []

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '400px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return (
      <div className='mx-auto w-full max-w-5xl px-3 py-4 @[40rem]/app:px-5'>
        <FeedLoading />
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className='flex h-full min-h-[280px] w-full items-center justify-center text-center'>
        <p className='text-neutral text-lg'>No comments found for this category.</p>
      </div>
    )
  }

  return (
    <div className='mx-auto w-full max-w-5xl px-3 py-4 @[40rem]/app:px-5'>
      <div className='flex flex-col gap-3'>
        {comments.map((item) => {
          if (item.kind !== 'comment') return null

          return (
            <FeedCommentCard
              key={`comment-${item.id}`}
              comment={{
                id: item.id,
                ens_name_id: item.ens_name_id,
                name: item.name,
                body: item.comment.body,
                created_at: item.created_at,
                author_address: item.comment.author_address,
                owner_address: item.owner_address,
                clubs: item.clubs,
              }}
            />
          )
        })}
        {isFetchingNextPage && <FeedLoading count={3} />}
        <div ref={loadMoreRef} className='h-1' />
      </div>
    </div>
  )
}

export default CommentsPanel
