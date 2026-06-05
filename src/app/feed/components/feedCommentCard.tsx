'use client'

import React from 'react'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useWindowSize } from 'ethereum-identity-kit'
import NameImage from '@/components/ui/nameImage'
import { beautifyName, normalizeName } from '@/lib/ens'
import { getNameTokenId } from '@/utils/web3/ens'
import type { CommentFeedItem } from '@/types/comment'
import ReplyArrowIcon from './replyArrowIcon'
import type { ReplyContext } from './types'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import User from '@/components/ui/user'
import { Address } from 'viem'

interface FeedCommentCardProps {
  comment: CommentFeedItem
  onReply?: (context: ReplyContext) => void
}

const FeedCommentCard: React.FC<FeedCommentCardProps> = ({ comment, onReply }) => {
  // const { categories } = useCategories()
  const { authStatus } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()
  const { width } = useWindowSize()

  const normalizedName = normalizeName(comment.name)
  const tokenId = getNameTokenId(normalizedName)
  const namePagePath = `/${encodeURIComponent(normalizedName)}#comments`

  // const clubs = comment.clubs ?? []
  const time = comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''

  return (
    <article
      onClick={() => router.push(namePagePath)}
      className='bg-secondary border-tertiary hover:border-foreground/30 cursor-pointer rounded-lg border-2 p-3 shadow-sm transition-colors sm:px-4'
    >
      <div className='flex flex-col gap-3 sm:gap-4'>
        <div className='flex w-full flex-wrap items-center justify-between'>
          <div className='flex flex-wrap items-center gap-1.5 gap-y-2 sm:gap-2'>
            <div className='flex'>
              {/* <Link
                href={`/profile/${comment.author_address}`}
                onClick={(e) => e.stopPropagation()}
                className='h-6 w-6 cursor-pointer transition-opacity hover:opacity-80 md:h-8.5 md:w-8.5'
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
                className='min-w-0 truncate text-lg font-semibold transition-opacity hover:opacity-80'
              >
                {displayName}
              </Link> */}
              <User
                address={comment.author_address as Address}
                wrapperClassName='justify-start'
                className='max-w-full py-1'
                avatarSize={width && width < 768 ? '22px' : '26px'}
              />
            </div>
            <p className='text-neutral pt-0.5 text-lg font-semibold'>
              <span className='hidden sm:inline'>commented</span> on
            </p>
            <HoverPrefetchLink
              href={`/${encodeURIComponent(normalizedName)}`}
              onClick={(e) => e.stopPropagation()}
              className='flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80 sm:gap-2'
            >
              <NameImage
                name={normalizedName}
                tokenId={tokenId}
                expiryDate={null}
                forceRegStatus={REGISTERED}
                className='h-7 w-7 rounded-sm sm:h-8.5 sm:w-8.5'
              />
              <div className='block truncate text-xl font-bold'>{beautifyName(normalizedName)}</div>
            </HoverPrefetchLink>
          </div>
          <span className='text-neutral hidden text-xs font-medium whitespace-nowrap md:block'>{time}</span>
        </div>

        <p className='text-foreground text-lg font-medium wrap-break-word whitespace-pre-wrap'>{comment.body}</p>

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
              className='text-primary text-md inline-flex cursor-pointer items-center gap-1 font-bold transition-opacity hover:opacity-80'
            >
              Reply <ReplyArrowIcon />
            </button>
          ) : (
            <span />
          )}
          <span className='text-neutral text-xs font-medium whitespace-nowrap md:hidden'>{time}</span>
        </div>
      </div>
    </article>
  )
}

export default FeedCommentCard
