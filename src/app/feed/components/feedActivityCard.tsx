'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import User from '@/components/ui/user'
import NameImage from '@/components/ui/nameImage'
import Price from '@/components/activity/components/price'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import ReplyArrowIcon from './replyArrowIcon'
import { ETH_ADDRESS } from '@/constants/web3/tokens'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { beautifyName, normalizeName } from '@/lib/ens'
import { getNameTokenId } from '@/utils/web3/ens'
import type { ActivityType, ProfileActivityEventType } from '@/types/profile'
import { useUserContext } from '@/context/user'
import { useConnectModal } from '@rainbow-me/rainbowkit'

interface FeedActivityCardProps {
  activity: ActivityType
  onReply?: (name: string) => void
}

const EVENT_COPY: Record<ProfileActivityEventType, { verb: string; actorLabel: string; counterpartyLabel?: string }> = {
  listed: { verb: 'listed', actorLabel: 'Listed by' },
  offer_made: { verb: 'received an offer', actorLabel: 'Offer from', counterpartyLabel: 'Owner' },
  bought: { verb: 'was bought', actorLabel: 'Buyer', counterpartyLabel: 'Seller' },
  sold: { verb: 'was sold', actorLabel: 'Seller', counterpartyLabel: 'Buyer' },
  offer_accepted: { verb: 'had an offer accepted', actorLabel: 'Accepted by', counterpartyLabel: 'Buyer' },
  offer_cancelled: { verb: 'had an offer cancelled', actorLabel: 'Cancelled by' },
  listing_cancelled: { verb: 'had its listing cancelled', actorLabel: 'Cancelled by' },
  mint: { verb: 'was minted', actorLabel: 'Minted by' },
  sent: { verb: 'was sent', actorLabel: 'From', counterpartyLabel: 'To' },
  received: { verb: 'was received', actorLabel: 'From', counterpartyLabel: 'To' },
  renewal: { verb: 'was extended', actorLabel: 'Extended by' },
}

const formatEventType = (eventType: string) => {
  return eventType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const FeedActivityCard: React.FC<FeedActivityCardProps> = ({ activity, onReply }) => {
  const { authStatus } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const router = useRouter()
  const normalizedName = normalizeName(activity.name)
  const tokenId = activity.token_id || getNameTokenId(normalizedName)
  const copy = EVENT_COPY[activity.event_type] ?? {
    verb: `had a ${formatEventType(activity.event_type).toLowerCase()} event`,
    actorLabel: 'User',
    counterpartyLabel: activity.counterparty_address ? 'Counterparty' : undefined,
  }
  const time = activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : ''
  const hasPrice = activity.price_wei && activity.price_wei !== '0'
  const namePagePath = `/${encodeURIComponent(normalizedName)}`

  return (
    <article
      onClick={() => router.push(namePagePath)}
      className='bg-secondary border-tertiary hover:border-foreground/30 cursor-pointer rounded-lg border-2 p-3 shadow-sm transition-colors sm:px-4'
    >
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 items-start gap-3'>
            <HoverPrefetchLink
              href={namePagePath}
              onClick={(e) => e.stopPropagation()}
              className='shrink-0 transition-opacity hover:opacity-80'
            >
              <NameImage
                name={normalizedName}
                tokenId={tokenId}
                expiryDate={null}
                forceRegStatus={REGISTERED}
                className='h-10 w-10 rounded-md sm:h-12 sm:w-12'
              />
            </HoverPrefetchLink>
            <div className='min-w-0'>
              <p className='text-neutral text-sm font-bold tracking-wide uppercase'>
                {activity.platform || 'ENS'} Activity
              </p>
              <p className='text-xl font-bold wrap-break-word sm:text-2xl'>
                <HoverPrefetchLink
                  href={namePagePath}
                  onClick={(e) => e.stopPropagation()}
                  className='hover:text-primary transition-colors'
                >
                  {beautifyName(normalizedName)}
                </HoverPrefetchLink>{' '}
                <span className='text-foreground/80 font-semibold'>{copy.verb}</span>
              </p>
            </div>
          </div>
          <span className='text-neutral shrink-0 text-xs font-medium whitespace-nowrap'>{time}</span>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {activity.actor_address && (
            <div className='bg-background/50 rounded-md p-2'>
              <p className='text-neutral mb-1 text-xs font-bold tracking-wide uppercase'>{copy.actorLabel}</p>
              <User address={activity.actor_address} wrapperClassName='justify-start' className='max-w-full' />
            </div>
          )}
          {copy.counterpartyLabel && activity.counterparty_address && (
            <div className='bg-background/50 rounded-md p-2'>
              <p className='text-neutral mb-1 text-xs font-bold tracking-wide uppercase'>{copy.counterpartyLabel}</p>
              <User address={activity.counterparty_address} wrapperClassName='justify-start' className='max-w-full' />
            </div>
          )}
          {hasPrice && (
            <div className='bg-background/50 rounded-md p-2'>
              <p className='text-neutral mb-1 text-xs font-bold tracking-wide uppercase'>Price</p>
              <Price price={activity.price_wei} currencyAddress={activity.currency_address || ETH_ADDRESS} />
            </div>
          )}
        </div>

        <div className='flex items-center justify-between gap-3'>
          {onReply ? (
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation()
                if (authStatus !== 'authenticated') {
                  openConnectModal?.()
                } else {
                  onReply(normalizedName)
                }
              }}
              className='text-primary text-md inline-flex cursor-pointer items-center gap-1 font-bold transition-opacity hover:opacity-80'
            >
              Reply <ReplyArrowIcon />
            </button>
          ) : (
            <span />
          )}
          {activity.transaction_hash && (
            <Link
              href={`https://etherscan.io/tx/${activity.transaction_hash}`}
              target='_blank'
              onClick={(e) => e.stopPropagation()}
              className='text-neutral hover:text-foreground text-sm font-bold transition-colors'
            >
              View transaction
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}

export default FeedActivityCard
