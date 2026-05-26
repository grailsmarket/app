'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import NameImage from '@/components/ui/nameImage'
import { beautifyName, normalizeName } from '@/lib/ens'
import { getMetadataAssetUrl, getNameTokenId } from '@/utils/web3/ens'
import type { CommentFeedItem } from '@/types/comment'
import ReplyArrowIcon from './replyArrowIcon'
import type { ReplyContext } from './types'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { cn } from '@/utils/tailwind'

interface FeedCommentCardProps {
  comment: CommentFeedItem
  onReply?: (context: ReplyContext) => void
  compact?: boolean
}

const FeedCommentCard: React.FC<FeedCommentCardProps> = ({ comment, onReply, compact }) => {
  // const { categories } = useCategories()
  const { authStatus } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()

  const normalizedName = normalizeName(comment.name)
  const tokenId = getNameTokenId(normalizedName)
  const namePagePath = `/${encodeURIComponent(normalizedName)}#comments`
  const [prefetch, setPrefetch] = useState(false)

  // const clubs = comment.clubs ?? []
  const time = comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''
  const { data: account } = useQuery({
    queryKey: ['account', comment.author_address],
    queryFn: () => fetchAccount(comment.author_address),
    enabled: !!comment.author_address,
    staleTime: 60_000,
  })

  const ensName = account?.ens?.name
  const displayName = ensName ? beautifyName(ensName) : truncateAddress(comment.author_address as `0x${string}`)

  return (
    <article
      onClick={() => router.push(namePagePath)}
      className={cn(
        'bg-secondary border-tertiary hover:border-foreground/30 cursor-pointer rounded-lg border-2 shadow-sm transition-colors',
        compact ? 'p-2' : 'p-3 sm:px-4'
      )}
    >
      <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3 sm:gap-4')}>
        <div className='flex w-full flex-wrap items-center justify-between'>
          <div className={cn('flex flex-wrap items-center gap-1.5 gap-y-2', !compact && 'sm:gap-2')}>
            <div className='flex items-center gap-1.5'>
              <Link
                href={`/profile/${comment.author_address}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'h-6 w-6 cursor-pointer transition-opacity hover:opacity-80',
                  !compact && 'md:h-8.5 md:w-8.5'
                )}
              >
                <Avatar
                  name={ensName || comment.author_address}
                  src={getMetadataAssetUrl(ensName || comment.author_address, 'avatar')}
                  style={{ width: '100%', height: '100%' }}
                />
              </Link>
              <Link
                href={`/profile/${comment.author_address}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'min-w-0 truncate font-semibold transition-opacity hover:opacity-80',
                  compact ? 'text-base' : 'text-lg'
                )}
              >
                {displayName}
              </Link>
            </div>
            <p className={cn('text-neutral px-0.5 pt-0.5 font-medium', compact ? 'text-sm' : 'text-md sm:px-1')}>
              <span className={compact ? 'hidden' : 'hidden sm:inline'}>commented</span> on
            </p>
            <Link
              href={`/${encodeURIComponent(normalizedName)}`}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80',
                !compact && 'sm:gap-2'
              )}
              prefetch={prefetch}
              onMouseEnter={() => setPrefetch(true)}
            >
              <NameImage
                name={normalizedName}
                tokenId={tokenId}
                expiryDate={null}
                forceRegStatus={REGISTERED}
                className={cn('h-6 w-6 rounded-sm', !compact && 'sm:h-8.5 sm:w-8.5')}
              />
              <div className={cn('block truncate font-bold', compact ? 'text-lg' : 'text-xl')}>
                {beautifyName(normalizedName)}
              </div>
            </Link>
          </div>
          <span
            className={cn('text-neutral text-xs font-medium whitespace-nowrap', compact ? 'hidden' : 'hidden md:block')}
          >
            {time}
          </span>
        </div>

        <p
          className={cn(
            'text-foreground font-medium wrap-break-word whitespace-pre-wrap',
            compact ? 'text-base' : 'text-lg'
          )}
        >
          {comment.body}
        </p>

        <div className='flex items-center justify-between'>
          {onReply ? (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                if (authStatus !== 'authenticated') {
                  openConnectModal?.()
                } else {
                  onReply({ comment, name: normalizedName })
                }
              }}
              className={cn(
                'text-primary inline-flex cursor-pointer items-center gap-1 font-bold transition-opacity hover:opacity-80',
                compact ? 'text-sm' : 'text-md'
              )}
            >
              Reply <ReplyArrowIcon />
            </button>
          ) : (
            <span />
          )}
          <span className={cn('text-neutral text-xs font-medium whitespace-nowrap', compact ? 'block' : 'md:hidden')}>
            {time}
          </span>
        </div>
      </div>
    </article>
  )
}

export default FeedCommentCard
