'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, fetchAccount, ShortArrow, truncateAddress } from 'ethereum-identity-kit'
import { getAddress, hexToBigInt, isAddress, labelhash } from 'viem'
import NameImage from '@/components/ui/nameImage'
import LoadingCell from '@/components/ui/loadingCell'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { useClickAway } from '@/hooks/useClickAway'
import { useDebounce } from '@/hooks/useDebounce'
import { useCommentFeed } from '@/hooks/comments/useCommentFeed'
import { useCommentQuota } from '@/hooks/comments/useCommentQuota'
import { postComment, type PostCommentError } from '@/api/comments/postComment'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { emptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { useUserContext } from '@/context/user'
import { beautifyName, normalizeName } from '@/lib/ens'
import { parseNameIdentifierSearch } from '@/utils/searchIdentifiers'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { getMetadataAssetUrl } from '@/utils/web3/ens'
import { cn } from '@/utils/tailwind'
import type { CommentFeedItem } from '@/types/comment'
import type { MarketplaceDomainType } from '@/types/domains'
import CheckIcon from 'public/icons/check.svg'

const MAX_SELECTED_CLUBS = 10
const MAX_COMMENT_LENGTH = 500

const getNameTokenId = (name: string) => hexToBigInt(labelhash(name.replace(/\.eth$/i, ''))).toString()

interface ViewportState {
  height: number
  offsetTop: number
}

const getNavOffset = () => (window.matchMedia('(min-width: 768px)').matches ? 70 : 54)

const CommentsFeed: React.FC = () => {
  const [ownerInput, setOwnerInput] = useState('')
  const [selectedClubs, setSelectedClubs] = useState<string[]>([])
  const [replyTarget, setReplyTarget] = useState<MarketplaceDomainType | null>(null)
  const [viewport, setViewport] = useState<ViewportState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastSeenNewestId = useRef<string | null>(null)

  const debouncedOwnerInput = useDebounce(ownerInput.trim(), 350)
  const ownerQuery = useQuery({
    queryKey: ['comments', 'feed', 'owner', debouncedOwnerInput],
    queryFn: async () => {
      if (!debouncedOwnerInput) return null
      if (isAddress(debouncedOwnerInput)) return getAddress(debouncedOwnerInput).toLowerCase()

      const account = await fetchAccount(debouncedOwnerInput)
      if (account?.address && isAddress(account.address)) return getAddress(account.address).toLowerCase()
      throw new Error('Owner not found')
    },
    enabled: debouncedOwnerInput.length > 0,
    retry: false,
  })

  const ownerAddress = debouncedOwnerInput ? ownerQuery.data || undefined : undefined
  const { comments, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useCommentFeed({
    owner: ownerAddress,
    clubs: selectedClubs,
  })

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    const update = () => {
      setViewport({ height: vv.height, offsetTop: vv.offsetTop })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || comments.length === 0) return

    const newest = comments[comments.length - 1]
    if (lastSeenNewestId.current !== newest.id) {
      el.scrollTop = el.scrollHeight
      lastSeenNewestId.current = newest.id
    }
  }, [comments])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    let previousHeight = vv.height
    let pinning = false

    const pinToBottom = () => {
      if (pinning) return
      pinning = true
      const start = performance.now()
      const tick = () => {
        const el = scrollRef.current
        if (el) el.scrollTop = el.scrollHeight
        if (performance.now() - start < 350) requestAnimationFrame(tick)
        else pinning = false
      }
      requestAnimationFrame(tick)
    }

    const onResize = () => {
      if (vv.height < previousHeight - 80) pinToBottom()
      previousHeight = vv.height
    }

    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  const loadOlder = async () => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    const previousHeight = el.scrollHeight
    await fetchNextPage()
    requestAnimationFrame(() => {
      const nextEl = scrollRef.current
      if (!nextEl) return
      nextEl.scrollTop = nextEl.scrollHeight - previousHeight + nextEl.scrollTop
    })
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop < 200) loadOlder()
  }

  const navOffset = viewport ? getNavOffset() : 0
  const viewportStyle = viewport
    ? {
        height: `${Math.max(360, viewport.height - navOffset)}px`,
        top: `${viewport.offsetTop + navOffset}px`,
      }
    : undefined

  return (
    <div
      style={viewportStyle}
      className={cn(
        'fixed right-0 left-0 mx-auto flex h-[calc(100dvh-54px)] w-full max-w-5xl flex-col transition-[height,top] duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] md:h-[calc(100dvh-70px)]',
        viewport ? '' : 'top-[54px] md:top-[70px]'
      )}
    >
      <FeedFilters
        ownerInput={ownerInput}
        onOwnerInputChange={setOwnerInput}
        ownerAddress={ownerAddress}
        ownerError={debouncedOwnerInput.length > 0 && ownerQuery.isError ? 'Enter a valid ENS name or address' : null}
        selectedClubs={selectedClubs}
        onSelectedClubsChange={setSelectedClubs}
      />

      <div ref={scrollRef} onScroll={handleScroll} className='min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5'>
        {isLoading ? (
          <FeedLoading />
        ) : comments.length === 0 ? (
          <div className='flex h-full min-h-[280px] items-center justify-center text-center'>
            <p className='text-neutral text-lg'>No comments found for these filters.</p>
          </div>
        ) : (
          <div className='flex flex-col gap-3'>
            {isFetchingNextPage && (
              <div className='py-2 text-center'>
                <span className='text-neutral text-sm'>Loading older comments...</span>
              </div>
            )}
            {hasNextPage && !isFetchingNextPage && (
              <button type='button' onClick={loadOlder} className='text-primary py-2 text-sm font-semibold'>
                Load older comments
              </button>
            )}
            {comments.map((comment) => (
              <FeedCommentCard key={comment.id} comment={comment} onReply={setReplyTarget} />
            ))}
          </div>
        )}
      </div>

      <FeedComposer selectedName={replyTarget} onSelectedNameChange={setReplyTarget} />
    </div>
  )
}

interface FeedFiltersProps {
  ownerInput: string
  onOwnerInputChange: (value: string) => void
  ownerAddress?: string
  ownerError: string | null
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
}

const FeedFilters: React.FC<FeedFiltersProps> = ({
  ownerInput,
  onOwnerInputChange,
  ownerAddress,
  ownerError,
  selectedClubs,
  onSelectedClubsChange,
}) => {
  return (
    <div className='border-tertiary flex flex-col gap-2 border-b-2 px-3 py-3 sm:px-5'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <h1 className='text-2xl font-bold'>Comments Feed</h1>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
          <div className='relative'>
            <input
              value={ownerInput}
              onChange={(e) => onOwnerInputChange(e.target.value)}
              placeholder='Filter owner by ENS or address'
              className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-full rounded-sm border-2 bg-transparent px-3 font-medium transition-colors outline-none sm:w-[280px]'
            />
          </div>
          <CategoryMultiSelect selectedClubs={selectedClubs} onSelectedClubsChange={onSelectedClubsChange} />
        </div>
      </div>
      {(ownerAddress || ownerError) && (
        <p className={cn('text-sm font-medium', ownerError ? 'text-red-400' : 'text-neutral')}>
          {ownerError || `Filtering names owned by ${ownerAddress}`}
        </p>
      )}
    </div>
  )
}

interface CategoryMultiSelectProps {
  selectedClubs: string[]
  onSelectedClubsChange: (clubs: string[]) => void
}

const CategoryMultiSelect: React.FC<CategoryMultiSelectProps> = ({ selectedClubs, onSelectedClubsChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const { categories } = useCategories()
  const dropdownRef = useClickAway(() => setIsOpen(false))

  const label = useMemo(() => {
    if (selectedClubs.length === 0) return 'All Categories'
    if (selectedClubs.length === 1)
      return categories?.find((category) => category.name === selectedClubs[0])?.display_name
    return `${selectedClubs.length} Categories`
  }, [categories, selectedClubs])

  const toggleCategory = (categoryName: string) => {
    if (selectedClubs.includes(categoryName)) {
      onSelectedClubsChange(selectedClubs.filter((club) => club !== categoryName))
      return
    }
    if (selectedClubs.length >= MAX_SELECTED_CLUBS) return
    onSelectedClubsChange([...selectedClubs, categoryName])
  }

  return (
    <div ref={dropdownRef as React.RefObject<HTMLDivElement>} className='relative'>
      <button
        type='button'
        onClick={() => setIsOpen((open) => !open)}
        className='border-tertiary hover:border-foreground/50 flex h-10 w-full cursor-pointer items-center justify-between gap-1.5 rounded-sm border-2 bg-transparent px-3 transition-all sm:w-[210px]'
      >
        <div className='flex min-w-0 items-center gap-2'>
          {selectedClubs.length > 0 && (
            <div className='flex items-center -space-x-1'>
              {selectedClubs.slice(0, 3).map((club) => (
                <Image
                  key={club}
                  src={getCategoryDetails(club).avatar}
                  alt={club}
                  width={20}
                  height={20}
                  className='border-background h-5 w-5 rounded-full border'
                />
              ))}
            </div>
          )}
          <p className='text-md truncate font-medium whitespace-nowrap'>{label}</p>
        </div>
        <ShortArrow className={cn('h-3 w-3 flex-shrink-0 transition-transform', isOpen ? 'rotate-0' : 'rotate-180')} />
      </button>

      {isOpen && (
        <div className='bg-background border-tertiary absolute right-0 z-50 mt-1 max-h-[min(420px,60vh)] w-full min-w-[240px] overflow-y-auto rounded-md border-2 shadow-lg sm:left-0'>
          <button
            type='button'
            onClick={() => onSelectedClubsChange([])}
            className={cn(
              'hover:bg-tertiary text-md flex w-full items-center gap-2 px-3 py-2 text-left font-medium transition-colors',
              selectedClubs.length === 0 && 'bg-secondary'
            )}
          >
            All Categories
          </button>
          {categories?.map((category) => {
            const isSelected = selectedClubs.includes(category.name)
            const details = getCategoryDetails(category.name)
            return (
              <button
                key={category.name}
                type='button'
                onClick={() => toggleCategory(category.name)}
                className={cn(
                  'hover:bg-tertiary text-md flex w-full items-center justify-between gap-2 px-3 py-2 text-left font-medium transition-colors',
                  isSelected && 'bg-secondary'
                )}
              >
                <span className='flex min-w-0 items-center gap-2'>
                  <Image
                    src={details.avatar}
                    alt={category.display_name}
                    width={20}
                    height={20}
                    className='h-5 w-5 rounded-full'
                  />
                  <span className='truncate'>{category.display_name}</span>
                </span>
                {isSelected && <Image src={CheckIcon} alt='Selected' width={16} height={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface FeedCommentCardProps {
  comment: CommentFeedItem
  onReply: (name: MarketplaceDomainType) => void
}

const FeedCommentCard: React.FC<FeedCommentCardProps> = ({ comment, onReply }) => {
  const { categories } = useCategories()
  const normalizedName = normalizeName(comment.name)
  const clubs = comment.clubs ?? []
  const time = comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''
  const { data: account } = useQuery({
    queryKey: ['account', comment.author_address],
    queryFn: () => fetchAccount(comment.author_address),
    enabled: !!comment.author_address,
    staleTime: 60_000,
  })

  const ensName = account?.ens?.name
  const displayName = ensName ? beautifyName(ensName) : truncateAddress(comment.author_address as `0x${string}`)

  const replyDomain = useMemo(
    () =>
      ({
        id: comment.ens_name_id,
        name: normalizedName,
        token_id: getNameTokenId(normalizedName),
        owner: comment.owner_address as `0x${string}`,
        expiry_date: null,
        registration_date: null,
        creation_date: null,
        metadata: {},
        has_numbers: false,
        has_emoji: false,
        clubs,
        club_ranks: null,
        listings: [],
        highest_offer_wei: null,
        highest_offer_id: null,
        highest_offer_currency: null,
        offer: null,
        last_sale_price: null,
        last_sale_price_usd: null,
        last_sale_currency: null,
        last_sale_date: null,
        view_count: 0,
        watchers_count: 0,
        downvotes: 0,
        upvotes: 0,
        watchlist_record_id: null,
      }) satisfies MarketplaceDomainType,
    [clubs, comment, normalizedName]
  )

  return (
    <article className='bg-secondary border-tertiary rounded-lg border-2 p-3 shadow-sm sm:p-4'>
      <div className='flex gap-3'>
        <Link href={`/${encodeURIComponent(normalizedName)}`} className='shrink-0 transition-opacity hover:opacity-80'>
          <NameImage
            name={normalizedName}
            tokenId={replyDomain.token_id}
            expiryDate={null}
            className='h-12 w-12 rounded-md sm:h-14 sm:w-14'
          />
        </Link>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-start justify-between gap-2'>
            <div className='min-w-0'>
              <Link
                href={`/${encodeURIComponent(normalizedName)}`}
                className='hover:text-primary block truncate text-xl font-bold transition-colors'
              >
                {beautifyName(normalizedName)}
              </Link>
              {clubs.length > 0 && (
                <p className='text-neutral text-sm font-medium'>
                  {clubs
                    .map((club) => categories?.find((category) => category.name === club)?.display_name || club)
                    .join(', ')}
                </p>
              )}
            </div>
            <span className='text-neutral text-xs whitespace-nowrap'>{time}</span>
          </div>

          <div className='mt-3 flex items-center gap-2'>
            <Link href={`/profile/${comment.author_address}`} className='shrink-0 transition-opacity hover:opacity-80'>
              <Avatar
                name={ensName || comment.author_address}
                src={getMetadataAssetUrl(ensName || comment.author_address, 'avatar')}
                style={{ width: '28px', height: '28px' }}
              />
            </Link>
            <Link
              href={`/profile/${comment.author_address}`}
              className='hover:text-primary min-w-0 truncate text-sm font-semibold transition-colors'
            >
              {displayName}
            </Link>
          </div>

          <p className='text-foreground mt-3 text-lg font-medium break-words whitespace-pre-wrap'>{comment.body}</p>

          <button
            type='button'
            onClick={() => onReply(replyDomain)}
            className='text-primary mt-3 inline-flex cursor-pointer items-center gap-1 text-sm font-bold transition-opacity hover:opacity-80'
          >
            Reply <ReplyArrowIcon />
          </button>
        </div>
      </div>
    </article>
  )
}

const ReplyArrowIcon = () => (
  <svg width='14' height='14' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path d='M9 17L4 12L9 7' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    <path d='M20 18V16C20 13.7909 18.2091 12 16 12H4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
  </svg>
)

interface FeedComposerProps {
  selectedName: MarketplaceDomainType | null
  onSelectedNameChange: (name: MarketplaceDomainType | null) => void
}

const FeedComposer: React.FC<FeedComposerProps> = ({ selectedName, onSelectedNameChange }) => {
  const { authStatus } = useUserContext()
  const queryClient = useQueryClient()
  const [nameInput, setNameInput] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const debouncedNameInput = useDebounce(nameInput.trim(), 300)
  const identifierSearch = parseNameIdentifierSearch(debouncedNameInput)
  const quota = useCommentQuota()

  const domainsQuery = useQuery({
    queryKey: ['comments', 'feed', 'target-search', debouncedNameInput],
    queryFn: () =>
      fetchDomains({
        limit: 5,
        pageParam: 1,
        filters: emptyFilterState,
        searchTerm: debouncedNameInput,
        enableBulkSearch: true,
        resolveIdentifiers: true,
      }),
    enabled: debouncedNameInput.length > 0,
  })

  const domains = domainsQuery.data?.domains.slice(0, 5) ?? []

  useEffect(() => {
    if (!debouncedNameInput || domains.length === 0) return
    const normalizedInput = debouncedNameInput.endsWith('.eth') ? normalizeName(debouncedNameInput) : null
    const exactDomain = normalizedInput
      ? domains.find((domain) => normalizeName(domain.name) === normalizedInput)
      : null
    if (exactDomain) {
      onSelectedNameChange(exactDomain)
      return
    }
    if (identifierSearch && domains[0]) onSelectedNameChange(domains[0])
  }, [debouncedNameInput, domains, identifierSearch, onSelectedNameChange])

  useEffect(() => {
    if (!selectedName) return
    setNameInput(normalizeName(selectedName.name))
    requestAnimationFrame(() => textareaRef.current?.focus())
  }, [selectedName])

  const post = useMutation({
    mutationFn: ({ name, value }: { name: string; value: string }) => postComment({ name, body: value }),
    onSuccess: () => {
      setBody('')
      setError(null)
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
      queryClient.invalidateQueries({ queryKey: ['comments', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['comments', 'quota'] })
    },
    onError: (e: PostCommentError) => {
      if (e.code === 'COMMENT_BANNED') setError('You are banned from commenting')
      else if (e.code === 'QUOTA_EXCEEDED') setError('Daily limit reached. Try again later.')
      else setError(e.message ?? 'Failed to post comment')
    },
  })

  const used = quota.data?.used ?? 0
  const max = quota.data?.max ?? 0
  const remaining = quota.data?.remaining ?? Math.max(0, max - used)
  const quotaExhausted = quota.data ? remaining <= 0 : false
  const composerLocked = !selectedName || authStatus !== 'authenticated' || quotaExhausted

  const autoSize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const submit = () => {
    const trimmed = body.trim()
    if (!selectedName || !trimmed || post.isPending || composerLocked) return
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      setError(`Comment too long (max ${MAX_COMMENT_LENGTH} characters)`)
      return
    }
    post.mutate({ name: normalizeName(selectedName.name), value: trimmed })
  }

  const hasSearchResults =
    nameInput.trim().length > 0 && !selectedName && (domainsQuery.isLoading || domains.length > 0)

  return (
    <div className='border-tertiary bg-background flex flex-col gap-2 border-t-2 p-3 sm:p-4'>
      {error && <p className='text-sm font-medium text-red-400'>{error}</p>}
      {authStatus !== 'authenticated' && <p className='text-neutral text-sm font-medium'>Sign in to post a comment.</p>}
      <div className='relative'>
        {hasSearchResults && (
          <div className='bg-background border-tertiary absolute right-0 bottom-[calc(100%+6px)] left-0 z-40 max-h-72 overflow-y-auto rounded-md border-2 shadow-lg'>
            {domainsQuery.isLoading ? (
              <div className='flex flex-col gap-2 p-3'>
                {Array.from({ length: 3 }).map((_, index) => (
                  <LoadingCell key={index} height='36px' width='100%' />
                ))}
              </div>
            ) : (
              domains.map((domain) => {
                const domainClubs = domain.clubs ?? []

                return (
                  <button
                    key={domain.id}
                    type='button'
                    onClick={() => onSelectedNameChange(domain)}
                    className='hover:bg-primary/10 flex w-full items-center gap-2 p-3 text-left transition-colors'
                  >
                    <NameImage
                      name={domain.name}
                      tokenId={domain.token_id}
                      expiryDate={domain.expiry_date}
                      className='h-9 w-9 rounded-sm'
                    />
                    <div className='min-w-0'>
                      <p className='truncate font-semibold'>{beautifyName(domain.name)}</p>
                      {domainClubs.length > 0 && (
                        <p className='text-neutral truncate text-sm'>{domainClubs.join(', ')}</p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
        <input
          value={nameInput}
          onChange={(e) => {
            const value = e.target.value
            setNameInput(value)
            if (selectedName && normalizeName(selectedName.name) !== normalizeName(value)) onSelectedNameChange(null)
          }}
          placeholder='ENS name, namehash, tokenId, or labelhash'
          className='border-tertiary text-md placeholder:text-neutral focus:border-foreground/50 h-10 w-full rounded-md border-2 bg-transparent px-3 font-medium transition-colors outline-none'
        />
      </div>

      {selectedName && (
        <div className='bg-secondary border-tertiary flex items-center justify-between gap-2 rounded-md border px-3 py-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <NameImage
              name={selectedName.name}
              tokenId={selectedName.token_id}
              expiryDate={selectedName.expiry_date}
              className='h-7 w-7 rounded-sm'
            />
            <span className='truncate text-sm font-semibold'>Replying on {beautifyName(selectedName.name)}</span>
          </div>
          <button
            type='button'
            onClick={() => onSelectedNameChange(null)}
            className='text-neutral hover:text-foreground text-sm font-bold'
          >
            Clear
          </button>
        </div>
      )}

      <div className='bg-secondary border-tertiary flex items-end gap-2 rounded-md border p-2'>
        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            autoSize()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          disabled={composerLocked || post.isPending}
          rows={1}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={
            selectedName
              ? quotaExhausted
                ? 'Daily limit reached'
                : 'Write a comment...'
              : 'Select a name before writing...'
          }
          className={cn(
            'text-foreground placeholder:text-neutral text-md max-h-36 flex-1 resize-none bg-transparent leading-6 outline-none',
            (composerLocked || post.isPending) && 'cursor-not-allowed opacity-50'
          )}
        />
        <button
          type='button'
          onClick={submit}
          disabled={!selectedName || !body.trim() || composerLocked || post.isPending}
          className='bg-primary text-background flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-all hover:opacity-80 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40'
          aria-label='Post comment'
        >
          <ReplyArrowIcon />
        </button>
      </div>
      <div className='text-neutral flex items-center justify-between text-xs'>
        <span>
          {body.length}/{MAX_COMMENT_LENGTH}
        </span>
        {quota.data && (
          <span>
            {used}/{max} comments used today
          </span>
        )}
      </div>
    </div>
  )
}

const FeedLoading = () => (
  <div className='flex flex-col gap-3'>
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className='bg-secondary border-tertiary rounded-lg border-2 p-4'>
        <div className='flex gap-3'>
          <LoadingCell height='56px' width='56px' radius='8px' />
          <div className='flex flex-1 flex-col gap-2'>
            <LoadingCell height='20px' width='45%' />
            <LoadingCell height='16px' width='30%' />
            <LoadingCell height='48px' width='100%' />
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default CommentsFeed
