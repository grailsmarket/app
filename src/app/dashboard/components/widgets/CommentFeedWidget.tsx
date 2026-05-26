'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import CommentRow from '@/components/comments/commentRow'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { getComments } from '@/api/comments/getComments'
import { useClickAway } from '@/hooks/useClickAway'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectCommentFeedConfig } from '@/state/reducers/dashboard/selectors'
import { cn } from '@/utils/tailwind'

const PAGE_SIZE = 50
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/

interface CommentFeedWidgetProps {
  instanceId: string
}

const CommentFeedWidget: React.FC<CommentFeedWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectCommentFeedConfig(state, instanceId))
  const { categories } = useCategories()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [addressInput, setAddressInput] = useState(config?.authorAddress ?? '')
  const [addressError, setAddressError] = useState<string | null>(null)

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryOpen(false)
  })

  const query = useInfiniteQuery({
    queryKey: ['dashboard', 'comment-feed', instanceId, config?.categories, config?.authorAddress],
    queryFn: ({ pageParam }) =>
      getComments({
        cursor: pageParam ?? undefined,
        limit: PAGE_SIZE,
        categories: config?.categories ?? [],
        authorAddress: config?.authorAddress,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!config,
    staleTime: 30_000,
  })

  const comments = useMemo(() => query.data?.pages.flatMap((page) => page.comments) ?? [], [query.data])
  const isAllCategories = !config?.categories.length

  const categoryLabel = isAllCategories
    ? 'All Categories'
    : config.categories.length === 1
      ? config.categories[0]
      : `${config.categories.length} categories`

  const toggleCategory = useCallback(
    (category: string) => {
      if (!config) return
      if (category === 'all') {
        dispatch(updateComponentConfig({ id: instanceId, patch: { categories: [] } }))
        setIsCategoryOpen(false)
        return
      }

      const next = config.categories.includes(category)
        ? config.categories.filter((item) => item !== category)
        : [...config.categories, category]
      dispatch(updateComponentConfig({ id: instanceId, patch: { categories: next } }))
    },
    [config, dispatch, instanceId]
  )

  const applyAddressFilter = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()
      const value = addressInput.trim()

      if (value && !ADDRESS_REGEX.test(value)) {
        setAddressError('Enter a valid address')
        return
      }

      setAddressError(null)
      dispatch(updateComponentConfig({ id: instanceId, patch: { authorAddress: value || null } }))
    },
    [addressInput, dispatch, instanceId]
  )

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !query.hasNextPage || query.isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
      query.fetchNextPage()
    }
  }, [query])

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <div className='border-tertiary flex flex-col border-b'>
        <div ref={categoryDropdownRef as React.RefObject<HTMLDivElement>} className='border-tertiary relative border-b'>
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
                {isAllCategories && <Check className='text-primary h-4 w-4' />}
              </button>
              {categories?.map((category) => (
                <button
                  key={category.name}
                  type='button'
                  onClick={() => toggleCategory(category.name)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{category.name}</p>
                  {config.categories.includes(category.name) && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={applyAddressFilter} className='flex h-10 items-center gap-2 px-3'>
          <input
            type='text'
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            placeholder='Filter by address'
            spellCheck={false}
            autoCapitalize='none'
            autoCorrect='off'
            className='placeholder:text-neutral min-w-0 flex-1 bg-transparent text-sm outline-none'
          />
          <button type='submit' className='text-primary shrink-0 cursor-pointer text-sm font-semibold'>
            Apply
          </button>
        </form>
        {addressError && <p className='px-3 pb-2 text-xs text-red-400'>{addressError}</p>}
      </div>

      <div ref={scrollRef} onScroll={handleScroll} className='flex-1 overflow-y-auto px-3'>
        {query.isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : query.isError ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>Unable to load comments</div>
        ) : comments.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No comments found</div>
        ) : (
          <>
            {comments.map((comment, index) => (
              <CommentRow
                key={comment.id}
                comment={comment}
                isLast={!query.hasNextPage && index === comments.length - 1}
                showTargetName
              />
            ))}
            <div className='text-neutral min-h-10 py-3 text-center text-xs'>
              {query.isFetchingNextPage ? 'Loading more...' : !query.hasNextPage ? 'End of comments' : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CommentFeedWidget
