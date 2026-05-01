'use client'

import React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
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

  const displayName = account?.ens?.name
    ? beautifyName(account.ens.name)
    : truncateAddress(comment.author_address as `0x${string}`)

  return (
    <div className='border-tertiary flex w-full flex-col gap-1 border-b py-3 last:border-b-0'>
      <div className='flex items-center justify-between gap-2'>
        <Link
          href={`/profile/${comment.author_address}`}
          className='text-foreground hover:text-primary text-sm font-medium'
        >
          {displayName}
        </Link>
        <span className='text-neutral text-xs'>{time}</span>
      </div>
      <p className='text-foreground text-md whitespace-pre-wrap break-words'>{comment.body}</p>
    </div>
  )
}

export default CommentRow
