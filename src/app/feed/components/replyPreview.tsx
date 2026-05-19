'use client'

import React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import NameImage from '@/components/ui/nameImage'
import { beautifyName, normalizeName } from '@/lib/ens'
import type { ReplyContext } from './types'

interface ReplyPreviewProps {
  context: ReplyContext
  onClear: () => void
}

const ReplyPreview: React.FC<ReplyPreviewProps> = ({ context, onClear }) => {
  const normalizedName = normalizeName(context.comment.name)
  const { data: account } = useQuery({
    queryKey: ['account', context.comment.author_address],
    queryFn: () => fetchAccount(context.comment.author_address),
    enabled: !!context.comment.author_address,
    staleTime: 60_000,
  })

  const ensName = account?.ens?.name
  const displayName = ensName ? beautifyName(ensName) : truncateAddress(context.comment.author_address as `0x${string}`)

  return (
    <div className='pointer-events-none absolute right-3 bottom-3 left-3 z-30 sm:right-5 sm:left-5'>
      <article className='bg-background border-primary pointer-events-auto rounded-lg border-2 p-3 shadow-2xl sm:p-4'>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <p className='text-primary text-sm font-bold'>Replying to</p>
          <button type='button' onClick={onClear} className='text-neutral hover:text-foreground text-sm font-bold'>
            Clear
          </button>
        </div>
        <div className='flex gap-3'>
          <Link
            href={`/${encodeURIComponent(normalizedName)}`}
            className='shrink-0 transition-opacity hover:opacity-80'
          >
            <NameImage
              name={normalizedName}
              tokenId={context.name.token_id}
              expiryDate={context.name.expiry_date}
              className='h-12 w-12 rounded-md'
            />
          </Link>
          <div className='min-w-0 flex-1'>
            <div className='flex min-w-0 items-center gap-2'>
              <Link
                href={`/${encodeURIComponent(normalizedName)}`}
                className='hover:text-primary truncate text-lg font-bold transition-colors'
              >
                {beautifyName(normalizedName)}
              </Link>
              <span className='text-neutral text-sm'>by</span>
              <Link
                href={`/profile/${context.comment.author_address}`}
                className='hover:text-primary truncate text-sm font-semibold transition-colors'
              >
                {displayName}
              </Link>
            </div>
            <p className='text-foreground text-md mt-2 line-clamp-3 font-medium break-words whitespace-pre-wrap'>
              {context.comment.body}
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}

export default ReplyPreview
