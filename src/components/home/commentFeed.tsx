'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import { Arrow } from 'ethereum-identity-kit'
import { useCommentFeed } from '@/hooks/comments/useCommentFeed'
import { useFeedScroll } from '@/hooks/comments/useFeedScroll'
import FeedCommentCard from '@/app/feed/components/feedCommentCard'
import FeedLoading from '@/app/feed/components/feedLoading'
import PrimaryButton from '../ui/buttons/primary'

const HomeCommentFeed = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { comments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCommentFeed({ clubs: [] })

  const { loadOlder, handleScroll } = useFeedScroll({
    scrollRef,
    comments,
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  return (
    <div className='flex w-full flex-col gap-1 sm:gap-2 lg:flex-row lg:gap-10'>
      <div className='p-md lg:px-lg flex w-full items-center justify-between lg:w-3/5 lg:flex-col lg:items-start lg:justify-start lg:gap-8 lg:pt-12'>
        <h2 className='font-sedan-sc text-3xl font-medium sm:text-4xl md:text-5xl lg:text-6xl'>Comment Feed</h2>
        <ul className='hidden list-inside list-disc space-y-2 lg:block'>
          <li className='text-xl font-medium'>See all of the latest comments from the community.</li>
          <li className='text-xl font-medium'>Comment on 3 Million+ domains in real time.</li>
          <li className='text-xl font-medium'>Engage with the domainers, discuss domains and more!</li>
          <li className='text-xl font-medium'>See all of the latest comments from the community.</li>
        </ul>
        <Link
          href='/feed'
          className='text-primary hover:text-primary/80 group flex items-center justify-end gap-2 text-center text-lg font-semibold sm:text-xl lg:mt-2'
        >
          <PrimaryButton className='hidden lg:block'>
            <p>Join the conversation!</p>
          </PrimaryButton>
          <div className='flex items-center justify-end gap-2 text-center text-lg font-semibold sm:text-xl lg:hidden'>
            <p>View Feed</p>
            <Arrow className='text-primary h-3 w-3 rotate-180 transition-all duration-300 group-hover:translate-x-1' />
          </div>
        </Link>
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className='max-h-[450px] overflow-y-auto rounded-md'>
        {isLoading ? (
          <FeedLoading count={5} />
        ) : comments.length === 0 ? (
          <p className='text-neutral py-6 text-center text-lg'>No comments yet.</p>
        ) : (
          <div className='flex flex-col gap-3'>
            {isFetchingNextPage && <FeedLoading count={3} />}
            {hasNextPage && !isFetchingNextPage && (
              <button type='button' onClick={loadOlder} className='text-primary py-2 text-sm font-semibold'>
                Load older comments
              </button>
            )}
            {comments.map((comment) => (
              <FeedCommentCard key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeCommentFeed
