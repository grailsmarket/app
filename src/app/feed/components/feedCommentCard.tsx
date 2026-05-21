'use client'

import React from 'react'
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

interface FeedCommentCardProps {
  comment: CommentFeedItem
  onReply?: (context: ReplyContext) => void
}

const FeedCommentCard: React.FC<FeedCommentCardProps> = ({ comment, onReply }) => {
  // const { categories } = useCategories()
  const { authStatus } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()

  const normalizedName = normalizeName(comment.name)
  const tokenId = getNameTokenId(normalizedName)
  const namePagePath = `/${encodeURIComponent(normalizedName)}#comments`

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
      className='bg-secondary border-tertiary cursor-pointer rounded-lg border-2 p-3 shadow-sm transition-colors hover:border-foreground/30 sm:px-4'
    >
      <div className='flex flex-col gap-3 sm:gap-4'>
        <div className='flex w-full flex-wrap items-center justify-between'>
          <div className='flex flex-wrap items-center gap-1.5 gap-y-2 sm:gap-2'>
            <div className='flex items-center gap-1.5'>
              <Link
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
              </Link>
            </div>
            <p className='text-neutral text-md px-0.5 pt-0.5 font-medium sm:px-1'>
              <span className='hidden sm:inline'>commented</span> on
            </p>
            <Link
              href={`/${encodeURIComponent(normalizedName)}`}
              onClick={(e) => e.stopPropagation()}
              className='flex min-w-0 items-center gap-1.5 transition-opacity hover:opacity-80 sm:gap-2'
            >
              <NameImage
                name={normalizedName}
                tokenId={tokenId}
                expiryDate={null}
                forceRegStatus={REGISTERED}
                className='h-6 w-6 rounded-sm sm:h-8.5 sm:w-8.5'
              />
              <div className='block truncate text-xl font-bold'>{beautifyName(normalizedName)}</div>
            </Link>
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
