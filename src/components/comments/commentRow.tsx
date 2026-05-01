'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { Avatar, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { beautifyName } from '@/lib/ens'
import type { Comment } from '@/types/comment'

interface Props {
  comment: Comment
}

const CommentRow: React.FC<Props> = ({ comment }) => {
  const time = comment.created_at
    ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
    : ''

  const { data: account } = useQuery({
    queryKey: ['account', comment.author_address],
    queryFn: () => fetchAccount(comment.author_address),
    enabled: !!comment.author_address,
    staleTime: 60_000,
  })

  const ensName = account?.ens?.name
  const displayName = ensName
    ? beautifyName(ensName)
    : truncateAddress(comment.author_address as `0x${string}`)

  return (
    <div className='border-tertiary flex w-full gap-2 border-b py-3 last:border-b-0'>
      <Link
        href={`/profile/${comment.author_address}`}
        className='shrink-0'
        aria-label={displayName}
      >
        <Avatar
          name={ensName || comment.author_address}
          src={account?.ens?.avatar}
          style={{ height: '36px', width: '36px' }}
        />
      </Link>
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        <div className='flex items-center justify-between gap-2'>
          <Link
            href={`/profile/${comment.author_address}`}
            className='hover:text-primary text-foreground truncate text-md font-semibold'
          >
            {displayName}
          </Link>
          <span className='text-neutral text-xs whitespace-nowrap'>{time}</span>
        </div>
        <p className='text-foreground text-md whitespace-pre-wrap break-words'>{comment.body}</p>
      </div>
    </div>
  )
}

export default CommentRow
