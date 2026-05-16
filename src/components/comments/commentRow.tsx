'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Avatar, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { beautifyName } from '@/lib/ens'
import type { Comment } from '@/types/comment'
import { cn } from '@/utils/tailwind'
import { getMetadataAssetUrl } from '@/utils/web3/ens'
import { accountQueryKey } from '@/utils/queryKeys'

interface Props {
  comment: Comment
  /** Render the trash icon when this is the caller's own comment. */
  canDelete?: boolean
  isLast?: boolean
  onRequestDelete?: (comment: Comment) => void
}

const CommentRow: React.FC<Props> = ({ comment, canDelete, isLast, onRequestDelete }) => {
  const time = comment.created_at ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }) : ''

  const { data: account } = useQuery({
    queryKey: accountQueryKey(comment.author_address),
    queryFn: () => fetchAccount(comment.author_address),
    enabled: !!comment.author_address,
    staleTime: 60_000,
  })

  const ensName = account?.ens?.name
  const displayName = ensName ? beautifyName(ensName) : truncateAddress(comment.author_address as `0x${string}`)

  return (
    <div className={cn('border-tertiary flex w-full gap-2.5 border-b py-3', isLast ? 'border-b-0' : '')}>
      <Link href={`/profile/${comment.author_address}`} className='shrink-0' aria-label={displayName}>
        <Avatar
          name={ensName || comment.author_address}
          src={getMetadataAssetUrl(ensName || comment.author_address, 'avatar')}
          style={{ height: '40px', width: '40px' }}
        />
      </Link>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <Link
            href={`/profile/${comment.author_address}`}
            className='hover:text-primary text-foreground truncate text-lg font-semibold'
          >
            {displayName}
          </Link>
          <div className='flex items-center gap-2'>
            <span className='text-neutral text-xs whitespace-nowrap'>{time}</span>
            {canDelete && onRequestDelete && (
              <button
                type='button'
                onClick={() => onRequestDelete(comment)}
                aria-label='Delete comment'
                className='text-neutral cursor-pointer transition-colors hover:text-red-400'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='14'
                  height='14'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'
                >
                  <path d='M3 6h18' />
                  <path d='M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                  <path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
                  <path d='M10 11v6' />
                  <path d='M14 11v6' />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className='text-foreground text-md font-medium break-words whitespace-pre-wrap'>{comment.body}</p>
      </div>
    </div>
  )
}

export default CommentRow
