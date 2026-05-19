'use client'

import React from 'react'
import { DEFAULT_HANDLE } from './constants'
import { ErrorState, EmptyState, PostSkeleton, PostSkeletonList } from './components/States'
import { MediaLightbox } from './components/MediaLightbox'
import { PostCard } from './components/PostCard'
import { useTwitterFeed } from './hooks/useTwitterFeed'

interface TwitterFeedWidgetProps {
  instanceId: string
}

const TwitterFeedWidget: React.FC<TwitterFeedWidgetProps> = ({ instanceId }) => {
  const {
    config,
    expandedMedia,
    handle,
    handleSubmit,
    inputError,
    inputValue,
    loadMoreRef,
    posts,
    query,
    setExpandedMedia,
    setInputValue,
  } = useTwitterFeed(instanceId)

  if (!config) return null

  return (
    <div className='flex h-full flex-col overflow-hidden bg-black text-[#e7e9ea]'>
      <form onSubmit={handleSubmit} className='flex shrink-0 items-center border-b border-[#2f3336] bg-black/95 py-0.5'>
        <div className='flex h-10 shrink-0 items-center pl-3 text-lg font-semibold text-[#e7e9ea]'>@</div>
        <input
          type='text'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={DEFAULT_HANDLE}
          spellCheck={false}
          autoCapitalize='none'
          autoCorrect='off'
          className='h-10 min-w-0 flex-1 bg-transparent px-1 text-[15px] font-medium outline-none placeholder:text-[#71767b]'
        />
        <button
          type='submit'
          className='mr-2 h-7 shrink-0 cursor-pointer rounded-sm bg-[#eff3f4] px-4 text-[13px] font-bold text-[#0f1419] transition-colors hover:bg-[#d7dbdc]'
        >
          Load
        </button>
      </form>

      {inputError && <div className='border-b border-[#2f3336] px-4 py-2 text-sm text-[#f4212e]'>{inputError}</div>}

      <MediaLightbox expanded={expandedMedia} onClose={() => setExpandedMedia(null)} />

      <div className='min-h-0 flex-1 overflow-y-auto'>
        {query.isLoading ? (
          <PostSkeletonList />
        ) : query.isError ? (
          <ErrorState message={query.error instanceof Error ? query.error.message : 'Unable to load X posts'} />
        ) : posts.length === 0 ? (
          <EmptyState handle={handle} />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onExpandMedia={(media) => setExpandedMedia({ postId: post.id, media })}
              />
            ))}

            <div ref={loadMoreRef} className='min-h-8'>
              {query.isFetchingNextPage && <PostSkeleton />}
              {!query.hasNextPage && (
                <div className='px-4 py-5 text-center text-[13px] text-[#71767b]'>End of timeline</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TwitterFeedWidget
