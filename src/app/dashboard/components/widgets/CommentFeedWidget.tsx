'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import CommentRow from '@/components/comments/commentRow'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { useClickAway } from '@/hooks/useClickAway'
import { getCommentFeed } from '@/api/comments/getCommentFeed'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectCommentFeedConfig } from '@/state/reducers/dashboard/selectors'
import { cn } from '@/utils/tailwind'
import type { CommentFeedItem } from '@/types/comment'

const PAGE_SIZE = 50

interface CommentFeedWidgetProps {
  instanceId: string
}

const getCommentName = (comment: CommentFeedItem) => comment.ens_name ?? comment.name ?? null

const CommentFeedWidget: React.FC<CommentFeedWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectCommentFeedConfig(state, instanceId))
  const { categories } = useCategories()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryOpen(false)
  })

  const selectedCategories = config?.categories ?? []
  const authorAddress = config?.authorAddress.trim() ?? ''

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['dashboard', 'comment-feed', instanceId, selectedCategories, authorAddress],
    queryFn: ({ pageParam }) =>
      getCommentFeed({
        cursor: pageParam,
        limit: PAGE_SIZE,
        categories: selectedCategories,
        authorAddress,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!config,
    staleTime: 30_000,
  })

  const comments = useMemo(() => data?.pages.flatMap((page) => page.comments) ?? [], [data])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 240) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const toggleCategory = useCallback(
    (category: string) => {
      if (!config) return
      if (category === 'all') {
        dispatch(updateComponentConfig({ id: instanceId, patch: { categories: [] } }))
        setIsCategoryOpen(false)
        return
      }

      const next = config.categories.includes(category)
        ? config.categories.filter((c) => c !== category)
        : [...config.categories, category]
      dispatch(updateComponentConfig({ id: instanceId, patch: { categories: next } }))
    },
    [config, dispatch, instanceId]
  )

  const handleAddressChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { authorAddress: event.target.value } }))
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  const categoryLabel =
    selectedCategories.length === 0
      ? 'All Categories'
      : selectedCategories.length === 1
        ? selectedCategories[0]
        : `${selectedCategories.length} categories`

  return (
    <div className='flex h-full flex-col'>
      <div className='border-tertiary flex flex-col border-b sm:flex-row'>
        <div ref={categoryDropdownRef} className='border-tertiary relative sm:w-1/2 sm:border-r'>
          <button
            type='button'
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>{categoryLabel}</p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isCategoryOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex max-h-64 w-full flex-col overflow-y-auto rounded-md border-2 shadow-lg'>
              <button
                type='button'
                onClick={() => toggleCategory('all')}
                className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
              >
                <p>All Categories</p>
                {selectedCategories.length === 0 && <Check className='text-primary h-4 w-4' />}
              </button>
              {categories?.map((cat) => (
                <button
                  type='button'
                  key={cat.name}
                  onClick={() => toggleCategory(cat.name)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{cat.name}</p>
                  {selectedCategories.includes(cat.name) && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          value={config.authorAddress}
          onChange={handleAddressChange}
          placeholder='Filter by address'
          className='placeholder:text-neutral h-10 min-w-0 flex-1 bg-transparent px-3 text-lg outline-none'
        />
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto px-3'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : comments.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No comments found</div>
        ) : (
          <>
            {comments.map((comment, index) => {
              const name = getCommentName(comment)

              return (
                <div key={comment.id}>
                  {name && (
                    <Link
                      href={`/${name}`}
                      className='text-primary hover:text-primary/80 mt-3 block truncate text-sm font-semibold'
                    >
                      {name}
                    </Link>
                  )}
                  <CommentRow comment={comment} isLast={index === comments.length - 1 && !isFetchingNextPage} />
                </div>
              )
            })}
            {isFetchingNextPage && (
              <div className='py-md flex w-full items-center justify-center'>
                <span className='text-neutral text-sm'>Loading more…</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CommentFeedWidget
