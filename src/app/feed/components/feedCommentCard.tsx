'use client'

import React from 'react'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { useAppContainerWidth } from '@/hooks/useAppContainerWidth'
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
  const width = useAppContainerWidth()

  const normalizedName = normalizeName(comment.name)
  const tokenId = getNameTokenId(normalizedName)
  const namePagePath = `/${encodeURIComponent(normalizedName)}#comments`

  // const clubs = comment.clubs ?? []
  const time = comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''

  return (
    <article
      onClick={() => router.push(namePagePath)}
      className='bg-secondary border-tertiary hover:border-foreground/30 cursor-pointer rounded-lg border-2 p-3 shadow-sm transition-colors @[40rem]/app:px-4'
    >
      <div className='flex flex-col gap-3 @[40rem]/app:gap-4'>
        <div className='flex w-full flex-wrap items-start justify-between'>
          <div className='flex flex-wrap items-center gap-1.5 gap-y-2 @[40rem]/app:gap-2'>
            <div className='flex'>
              <User
                address={comment.author_address as Address}
                wrapperClassName='justify-start'
                className='max-w-full py-[3px] @[40rem]/app:py-1'
                avatarSize={width && width < 768 ? '20px' : '24px'}
                alignTooltip='left'
              />
            </div>
            <p className='text-neutral pt-0.5 text-lg font-semibold'>
              <span className='hidden @[40rem]/app:inline'>commented</span> on
            </p>
            <HoverPrefetchLink
              href={`/${encodeURIComponent(normalizedName)}`}
              onClick={(e) => e.stopPropagation()}
              className='flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80 @[40rem]/app:gap-2'
            >
              <NameImage
                name={normalizedName}
                tokenId={tokenId}
                expiryDate={null}
                forceRegStatus={REGISTERED}
                className='h-6.5 w-6.5 rounded-sm @[40rem]/app:h-8 @[40rem]/app:w-8'
              />
              <div className='block truncate text-xl font-bold'>{beautifyName(normalizedName)}</div>
            </HoverPrefetchLink>
          </div>
          <span className='text-neutral hidden text-xs font-medium whitespace-nowrap @[40rem]/app:block'>{time}</span>
        </div>

        <div className='flex flex-row items-end justify-between'>
          <p className='text-foreground w-full max-w-full text-lg font-medium wrap-break-word whitespace-pre-wrap @[40rem]/app:max-w-[calc(100%-72px)]'>
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
                className='text-primary text-md hidden cursor-pointer items-center gap-1 font-bold transition-opacity hover:opacity-80 @[40rem]/app:inline-flex'
              >
                Reply <ReplyArrowIcon />
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>

        <div className='flex items-center justify-between @[40rem]/app:hidden'>
          <span className='text-neutral text-xs font-medium whitespace-nowrap'>{time}</span>
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
        </div>
      </div>
    </article>
  )
}

export default FeedCommentCard
