'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { LoadingCell } from 'ethereum-identity-kit'
import { useInfiniteQuery } from '@tanstack/react-query'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectTwitterFeedConfig } from '@/state/reducers/dashboard/selectors'
import { cn } from '@/utils/tailwind'
import formatTimeAgo from '@/utils/time/formatTimeAgo'

interface TwitterFeedWidgetProps {
  instanceId: string
}

type TwitterEntity = {
  start: number
  end: number
}

type TwitterUrlEntity = TwitterEntity & {
  url: string
  expanded_url?: string
  display_url?: string
  media_key?: string
}

type TwitterMentionEntity = TwitterEntity & {
  username: string
}

type TwitterTagEntity = TwitterEntity & {
  tag: string
}

type TwitterPostMedia = {
  key: string
  type: 'photo' | 'video' | 'animated_gif'
  url: string | null
  previewImageUrl?: string
  width?: number
  height?: number
}

type TwitterPost = {
  id: string
  text: string
  createdAt: string | null
  url: string
  author: {
    name: string
    username: string
    profileImageUrl?: string
    verified: boolean
    verifiedType: 'blue' | 'business' | 'government' | 'none'
  }
  entities: {
    urls?: TwitterUrlEntity[]
    mentions?: TwitterMentionEntity[]
    hashtags?: TwitterTagEntity[]
    cashtags?: TwitterTagEntity[]
  }
  media: TwitterPostMedia[]
  metrics: {
    replies: number
    reposts: number
    likes: number
    views: number
  }
}

type TwitterPostsResponse = {
  posts: TwitterPost[]
  nextToken: string | null
}

const DEFAULT_HANDLE = 'ENSMarketBot'
const HANDLE_REGEX = /^[A-Za-z0-9_]{1,15}$/

const fetchTwitterPosts = async ({
  handle,
  paginationToken,
}: {
  handle: string
  paginationToken?: string
}): Promise<TwitterPostsResponse> => {
  const params = new URLSearchParams({ handle, limit: '20' })
  if (paginationToken) params.set('paginationToken', paginationToken)

  const response = await fetch(`/api/twitter/posts?${params.toString()}`)
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'Unable to load X posts')
  }

  return payload as TwitterPostsResponse
}

const sanitizeHandle = (value: string) => value.trim().replace(/^@/, '')

const formatMetric = (value: number) =>
  new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

const sliceByCodePoints = (text: string, start: number, end: number) => Array.from(text).slice(start, end).join('')

type ExpandedMedia = {
  postId: string
  media: TwitterPostMedia
}

const buildMediaLayoutId = (postId: string, mediaKey: string) => `twitter-media-${postId}-${mediaKey}`

const TwitterFeedWidget: React.FC<TwitterFeedWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectTwitterFeedConfig(state, instanceId))
  const handle = config?.handle || DEFAULT_HANDLE
  const [inputValue, setInputValue] = useState(handle)
  const [inputError, setInputError] = useState<string | null>(null)
  const [expandedMedia, setExpandedMedia] = useState<ExpandedMedia | null>(null)
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({ rootMargin: '600px 0px 600px 0px' })

  const canFetch = Boolean(config && HANDLE_REGEX.test(handle))

  const query = useInfiniteQuery({
    queryKey: ['twitter-posts', handle],
    queryFn: ({ pageParam }) => fetchTwitterPosts({ handle, paginationToken: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextToken ?? undefined,
    enabled: canFetch,
    staleTime: 60_000,
  })

  const posts = useMemo(() => query.data?.pages.flatMap((page) => page.posts) ?? [], [query.data])

  useEffect(() => {
    setInputValue(handle)
    setInputError(null)
  }, [handle])

  useEffect(() => {
    if (isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [isIntersecting, query])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const nextHandle = sanitizeHandle(inputValue)
      if (!HANDLE_REGEX.test(nextHandle)) {
        setInputError('Enter a valid X username.')
        return
      }

      setInputError(null)
      dispatch(updateComponentConfig({ id: instanceId, patch: { handle: nextHandle } }))
    },
    [dispatch, inputValue, instanceId]
  )

  if (!config) return null

  return (
    <div className='flex h-full flex-col overflow-hidden bg-black text-[#e7e9ea]'>
      <form onSubmit={handleSubmit} className='flex shrink-0 py-0.5 items-center border-b border-[#2f3336] bg-black/95'>
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

const PostCard: React.FC<{ post: TwitterPost; onExpandMedia: (media: TwitterPostMedia) => void }> = ({
  post,
  onExpandMedia,
}) => (
  <article className='border-b border-[#2f3336] px-4 py-3 transition-colors hover:bg-[#080808]'>
    <div className='flex gap-3'>
      <a href={`https://x.com/${post.author.username}`} target='_blank' rel='noreferrer' className='shrink-0'>
        {post.author.profileImageUrl ? (
          <img
            src={post.author.profileImageUrl}
            alt=''
            className='h-10 w-10 rounded-full object-cover'
            loading='lazy'
          />
        ) : (
          <div className='h-10 w-10 rounded-full bg-[#333639]' />
        )}
      </a>

      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-center gap-1 text-[15px] leading-5'>
          <a
            href={`https://x.com/${post.author.username}`}
            target='_blank'
            rel='noreferrer'
            className='truncate font-bold text-[#e7e9ea] hover:underline'
          >
            {post.author.name}
          </a>
          {post.author.verified && <VerifiedBadge type={post.author.verifiedType} />}
          <span className='truncate text-[#71767b]'>@{post.author.username}</span>
          {post.createdAt && <span className='text-[#71767b]'>·</span>}
          {post.createdAt && (
            <a href={post.url} target='_blank' rel='noreferrer' className='shrink-0 text-[#71767b] hover:underline'>
              {formatTimeAgo(post.createdAt).replace(' ago', '')}
            </a>
          )}
        </div>

        <div className='text-[15px] leading-5 break-words whitespace-pre-wrap text-[#e7e9ea]'>
          <PostText post={post} />
        </div>

        {post.media.length > 0 && <PostMedia postId={post.id} media={post.media} onExpand={onExpandMedia} />}

        <div className='mt-3 grid max-w-[425px] grid-cols-4 text-[#71767b]'>
          <Metric
            href={post.url}
            icon={<ReplyIcon />}
            value={post.metrics.replies}
            hoverClass='group-hover:text-[#1d9bf0]'
          />
          <Metric
            href={post.url}
            icon={<RepostIcon />}
            value={post.metrics.reposts}
            hoverClass='group-hover:text-[#00ba7c]'
          />
          <Metric
            href={post.url}
            icon={<LikeIcon />}
            value={post.metrics.likes}
            hoverClass='group-hover:text-[#f91880]'
          />
          <Metric
            href={post.url}
            icon={<ViewIcon />}
            value={post.metrics.views}
            hoverClass='group-hover:text-[#1d9bf0]'
          />
        </div>
      </div>
    </div>
  </article>
)

const PostText: React.FC<{ post: TwitterPost }> = ({ post }) => {
  const entities = [
    ...(post.entities.urls ?? []).map((entity) => ({ ...entity, kind: 'url' as const })),
    ...(post.entities.mentions ?? []).map((entity) => ({ ...entity, kind: 'mention' as const })),
    ...(post.entities.hashtags ?? []).map((entity) => ({ ...entity, kind: 'hashtag' as const })),
    ...(post.entities.cashtags ?? []).map((entity) => ({ ...entity, kind: 'cashtag' as const })),
  ].sort((a, b) => a.start - b.start)

  if (entities.length === 0) return <>{post.text}</>

  const parts: React.ReactNode[] = []
  let cursor = 0

  for (const entity of entities) {
    if (entity.start < cursor) continue

    const plainText = sliceByCodePoints(post.text, cursor, entity.start)
    if (plainText) parts.push(<React.Fragment key={`text-${cursor}`}>{plainText}</React.Fragment>)

    if (entity.kind === 'url' && entity.media_key) {
      cursor = entity.end
      continue
    }

    parts.push(<EntityLink key={`${entity.kind}-${entity.start}`} entity={entity} text={post.text} />)
    cursor = entity.end
  }

  const remainingText = sliceByCodePoints(post.text, cursor, Array.from(post.text).length)
  if (remainingText) parts.push(<React.Fragment key='text-end'>{remainingText}</React.Fragment>)

  return <>{parts}</>
}

const EntityLink: React.FC<{
  entity:
  | (TwitterUrlEntity & { kind: 'url' })
  | (TwitterMentionEntity & { kind: 'mention' })
  | (TwitterTagEntity & { kind: 'hashtag' | 'cashtag' })
  text: string
}> = ({ entity, text }) => {
  if (entity.kind === 'url') {
    return (
      <a
        href={entity.expanded_url ?? entity.url}
        target='_blank'
        rel='noreferrer'
        className='text-[#1d9bf0] hover:underline'
      >
        {entity.display_url ?? entity.url}
      </a>
    )
  }

  if (entity.kind === 'mention') {
    return (
      <a
        href={`https://x.com/${entity.username}`}
        target='_blank'
        rel='noreferrer'
        className='text-[#1d9bf0] hover:underline'
      >
        @{entity.username}
      </a>
    )
  }

  const prefix = entity.kind === 'hashtag' ? '#' : '$'
  return (
    <a
      href={`https://x.com/search?q=${encodeURIComponent(`${prefix}${entity.tag}`)}`}
      target='_blank'
      rel='noreferrer'
      className='text-[#1d9bf0] hover:underline'
    >
      {sliceByCodePoints(text, entity.start, entity.end)}
    </a>
  )
}

const PostMedia: React.FC<{
  postId: string
  media: TwitterPostMedia[]
  onExpand: (media: TwitterPostMedia) => void
}> = ({ postId, media, onExpand }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeMedia = media[Math.min(activeIndex, media.length - 1)]
  const showCarouselControls = media.length > 1

  if (!activeMedia) return null

  const isVideo = activeMedia.type === 'video' || activeMedia.type === 'animated_gif'
  const previewSrc = activeMedia.type === 'photo' ? activeMedia.url : activeMedia.previewImageUrl
  const canExpand = Boolean(activeMedia.url || activeMedia.previewImageUrl)
  const layoutId = buildMediaLayoutId(postId, activeMedia.key)

  return (
    <div className='relative mt-3 overflow-hidden rounded-2xl border border-[#2f3336] bg-[#16181c]'>
      <div className='relative flex aspect-[16/10] items-center justify-center overflow-hidden'>
        {canExpand && previewSrc ? (
          <button
            type='button'
            onClick={() => onExpand(activeMedia)}
            aria-label={isVideo ? 'Play video' : 'Expand image'}
            className='group block h-full w-full cursor-zoom-in'
          >
            <motion.div layoutId={layoutId} className='h-full w-full'>
              <img src={previewSrc} alt='' className='h-full w-full object-cover' loading='lazy' />
            </motion.div>
            {isVideo && (
              <span className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                <span className='flex h-14 w-14 items-center justify-center rounded-full bg-black/60 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-110'>
                  <PlayIcon />
                </span>
              </span>
            )}
          </button>
        ) : (
          <MediaFallback />
        )}

        {showCarouselControls && (
          <>
            <CarouselButton
              direction='previous'
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
            />
            <CarouselButton
              direction='next'
              disabled={activeIndex === media.length - 1}
              onClick={() => setActiveIndex((index) => Math.min(index + 1, media.length - 1))}
            />
          </>
        )}
      </div>

      {showCarouselControls && (
        <div className='absolute right-0 bottom-3 left-0 flex justify-center gap-1.5'>
          {media.map((item, index) => (
            <button
              key={item.key}
              type='button'
              aria-label={`Show media ${index + 1}`}
              onClick={(e) => {
                e.stopPropagation()
                setActiveIndex(index)
              }}
              className={cn(
                'h-1.5 w-1.5 cursor-pointer rounded-full',
                index === activeIndex ? 'bg-white' : 'bg-white/40'
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const CarouselButton: React.FC<{
  direction: 'previous' | 'next'
  disabled: boolean
  onClick: () => void
}> = ({ direction, disabled, onClick }) => (
  <button
    type='button'
    aria-label={direction === 'previous' ? 'Previous media' : 'Next media'}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
    className={cn(
      'absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#0f1419]/80 text-white transition-colors hover:bg-[#272c30] disabled:pointer-events-none disabled:opacity-0',
      direction === 'previous' ? 'left-3' : 'right-3'
    )}
  >
    <ChevronIcon className={cn('h-5 w-5', direction === 'previous' && 'rotate-180')} />
  </button>
)

const Metric: React.FC<{ href: string; icon: React.ReactNode; value: number; hoverClass: string }> = ({
  href,
  icon,
  value,
  hoverClass,
}) => (
  <a
    href={href}
    target='_blank'
    rel='noreferrer'
    className={cn('group flex items-center gap-1 text-[13px]', hoverClass)}
  >
    <span className='flex h-[18px] w-[18px] items-center justify-center'>{icon}</span>
    {value > 0 && <span>{formatMetric(value)}</span>}
  </a>
)

const VerifiedBadge: React.FC<{ type: TwitterPost['author']['verifiedType'] }> = ({ type }) => (
  <svg
    viewBox='0 0 24 24'
    aria-label='Verified account'
    className={cn('h-[18px] w-[18px] shrink-0', type === 'business' ? 'text-[#ffd400]' : 'text-[#1d9bf0]')}
  >
    <path
      fill='currentColor'
      d='M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81C14.67 2.63 13.43 1.75 12 1.75s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.27 2.52-.81 3.91C2.63 9.33 1.75 10.57 1.75 12s.88 2.67 2.19 3.34c-.46 1.39-.2 2.9.81 3.91s2.52 1.27 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.46 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zM10.6 16.6l-3.2-3.2 1.4-1.4 1.8 1.8 4.6-4.6 1.4 1.4-6 6z'
    />
  </svg>
)

const PostSkeletonList: React.FC = () => (
  <>
    {Array.from({ length: 3 }).map((_, index) => (
      <PostSkeleton key={index} />
    ))}
  </>
)

const PostSkeleton: React.FC = () => (
  <div className='border-b border-[#2f3336] px-4 py-3'>
    <div className='flex gap-3'>
      <LoadingCell height='40px' width='40px' radius='50%' />
      <div className='min-w-0 flex-1 space-y-2'>
        <LoadingCell height='14px' width='60%' />
        <LoadingCell height='14px' width='90%' />
        <LoadingCell height='14px' width='75%' />
        <LoadingCell height='160px' width='100%' radius='16px' />
      </div>
    </div>
  </div>
)

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
    <div className='text-base font-bold text-[#e7e9ea]'>Posts are unavailable</div>
    <div className='mt-1 text-sm text-[#71767b]'>{message}</div>
  </div>
)

const EmptyState: React.FC<{ handle: string }> = ({ handle }) => (
  <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
    <div className='text-base font-bold text-[#e7e9ea]'>No posts yet</div>
    <div className='mt-1 text-sm text-[#71767b]'>@{handle} does not have any original posts or replies to show.</div>
  </div>
)

const MediaFallback: React.FC = () => (
  <div className='flex h-full w-full items-center justify-center text-sm text-[#71767b]'>Media unavailable</div>
)

const MediaLightbox: React.FC<{ expanded: ExpandedMedia | null; onClose: () => void }> = ({ expanded, onClose }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!expanded) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKey)
    }
  }, [expanded, onClose])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {expanded && (
        <motion.div
          key='twitter-media-lightbox'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className='fixed inset-0 z-200 flex h-dvh w-screen items-center justify-center bg-black/80 backdrop-blur-sm'
          onClick={onClose}
        >
          <button
            type='button'
            aria-label='Close'
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className='absolute top-4 right-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80'
          >
            <CloseIcon />
          </button>
          <motion.div
            layoutId={buildMediaLayoutId(expanded.postId, expanded.media.key)}
            className='flex max-h-[90dvh] max-w-[92dvw] items-center justify-center'
            onClick={(e) => e.stopPropagation()}
          >
            <ExpandedMediaContent media={expanded.media} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

const ExpandedMediaContent: React.FC<{ media: TwitterPostMedia }> = ({ media }) => {
  const className = 'max-h-[90dvh] max-w-[92dvw] object-contain'
  const isVideo = media.type === 'video' || media.type === 'animated_gif'

  if (isVideo && media.url) {
    return (
      <video
        src={media.url}
        poster={media.previewImageUrl}
        controls
        autoPlay
        playsInline
        loop={media.type === 'animated_gif'}
        muted={media.type === 'animated_gif'}
        className={className}
      />
    )
  }

  const imageSrc = media.url ?? media.previewImageUrl
  if (!imageSrc) return null

  return <img src={imageSrc} alt='' className={className} />
}

const PlayIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-6 w-6 text-white' aria-hidden='true'>
    <path fill='currentColor' d='M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z' />
  </svg>
)

const CloseIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-5 w-5' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M18.3 5.71 12 12.01l-6.29-6.3-1.42 1.42L10.59 13.43l-6.3 6.29 1.42 1.42L12 14.84l6.3 6.3 1.41-1.42-6.29-6.29 6.29-6.3z'
    />
  </svg>
)

const ReplyIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M1.75 11.5C1.75 6.8 5.75 3 11 3s9.25 3.8 9.25 8.5S16.25 20 11 20c-.9 0-1.77-.11-2.58-.32l-4.2 1.22c-.71.21-1.36-.44-1.15-1.15l1.15-3.86A8.08 8.08 0 0 1 1.75 11.5Zm9.25-7C6.58 4.5 3.25 7.58 3.25 11.5c0 1.33.39 2.57 1.08 3.62l.18.27-.85 2.86 3.05-.89.25.08c1.19.38 2.53.56 4.04.56 4.42 0 7.75-3.08 7.75-6.5S15.42 4.5 11 4.5Z'
    />
  </svg>
)

const RepostIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M4.5 7.5h10.1l-2.3-2.3 1.1-1.1 4.1 4.1-4.1 4.1-1.1-1.1 2.3-2.2H6v6H4.5v-7.5Zm15 9H9.4l2.3 2.3-1.1 1.1-4.1-4.1 4.1-4.1 1.1 1.1L9.4 15H18V9h1.5v7.5Z'
    />
  </svg>
)

const LikeIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M16.7 3.25c-1.74 0-3.31.82-4.3 2.09a5.42 5.42 0 0 0-4.3-2.09c-3.03 0-5.45 2.48-5.45 5.56 0 3.1 2.12 5.54 4.11 7.18 1.77 1.46 3.87 2.79 4.96 3.43.42.25.94.25 1.36 0 1.09-.64 3.19-1.97 4.96-3.43 1.99-1.64 4.11-4.08 4.11-7.18 0-3.08-2.42-5.56-5.45-5.56Zm.38 11.58c-1.62 1.34-3.57 2.57-4.68 3.23-1.11-.66-3.06-1.89-4.68-3.23-1.85-1.52-3.57-3.56-3.57-6.02 0-2.26 1.76-4.06 3.95-4.06 1.74 0 3.2 1.12 3.7 2.66h1.2c.5-1.54 1.96-2.66 3.7-2.66 2.19 0 3.95 1.8 3.95 4.06 0 2.46-1.72 4.5-3.57 6.02Z'
    />
  </svg>
)

const ViewIcon: React.FC = () => (
  <svg viewBox='0 0 24 24' className='h-[18px] w-[18px]' aria-hidden='true'>
    <path
      fill='currentColor'
      d='M8.75 21V9.75h2.5V21h-2.5Zm-5 0v-7.25h2.5V21h-2.5Zm10 0V3h2.5v18h-2.5Zm5 0V7.25h2.5V21h-2.5Z'
    />
  </svg>
)

const ChevronIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox='0 0 24 24' className={className} aria-hidden='true'>
    <path fill='currentColor' d='m9.71 18.71-1.42-1.42L13.59 12l-5.3-5.29 1.42-1.42L16.41 12l-6.7 6.71Z' />
  </svg>
)

export default TwitterFeedWidget
