'use client'

import React from 'react'
import Link from 'next/link'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import { useQuery } from '@tanstack/react-query'
import { Avatar, fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import NameImage from '@/components/ui/nameImage'
import { beautifyName, normalizeName } from '@/lib/ens'
import { getMetadataAssetUrl, getNameTokenId } from '@/utils/web3/ens'
import type { ReplyContext } from './types'
import { REGISTERED } from '@/constants/domains/registrationStatuses'

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
    <div className='md:px-lg pointer-events-none absolute right-3 bottom-3 left-3 z-30 mx-auto max-w-5xl sm:right-5 sm:left-5'>
      <article
        onClick={(e) => e.stopPropagation()}
        className='bg-background border-primary pointer-events-auto rounded-lg border-2 p-3 shadow-2xl sm:p-4'
      >
        <div className='mb-2 flex items-center justify-between gap-3'>
          <p className='text-primary text-sm font-bold'>Replying to</p>
          <button type='button' onClick={onClear} className='text-neutral hover:text-foreground text-sm font-bold'>
            Clear
          </button>
        </div>
        <div className='flex gap-3'>
          <HoverPrefetchLink
            href={`/${encodeURIComponent(normalizedName)}`}
            className='shrink-0 transition-opacity hover:opacity-80'
          >
            <NameImage
              name={normalizedName}
              tokenId={getNameTokenId(normalizedName)}
              expiryDate={null}
              forceRegStatus={REGISTERED}
              className='mt-1.5 h-10.5 w-10.5 rounded-md'
            />
          </HoverPrefetchLink>
          <div className='min-w-0 flex-1'>
            <div className='flex min-w-0 items-center gap-2'>
              <HoverPrefetchLink
                href={`/${encodeURIComponent(normalizedName)}`}
                className='hover:text-primary truncate text-lg font-bold transition-colors'
              >
                {beautifyName(normalizedName)}
              </HoverPrefetchLink>
              <span className='text-neutral pt-1 text-sm'>by</span>
              <div className='flex items-center gap-1.5'>
                <Avatar
                  name={ensName || context.comment.author_address}
                  src={getMetadataAssetUrl(ensName || context.comment.author_address, 'avatar')}
                  style={{ width: '24px', height: '24px' }}
                />
                <Link
                  href={`/profile/${context.comment.author_address}`}
                  className='hover:text-primary text-md truncate font-semibold transition-colors'
                >
                  {displayName}
                </Link>
              </div>
            </div>
            <p className='text-foreground mt-1 line-clamp-3 text-lg font-medium wrap-break-word whitespace-pre-wrap'>
              {context.comment.body}
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}

export default ReplyPreview
