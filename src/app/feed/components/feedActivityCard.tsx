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
import { useWindowSize } from 'ethereum-identity-kit'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Image from 'next/image'

interface FeedActivityCardProps {
  activity: ActivityType
  onReply?: (name: string) => void
}

const EVENT_COPY: Record<ProfileActivityEventType, { verb: string; actorLabel: string; counterpartyLabel?: string }> = {
  registration: { verb: 'registered', actorLabel: 'Registered by' },
  sale: { verb: 'sold', actorLabel: 'Seller', counterpartyLabel: 'Buyer' },
  offer: { verb: 'received an offer', actorLabel: 'Offer from', counterpartyLabel: 'Offerer' },
  listed: { verb: 'listed', actorLabel: 'Listed by' },
  offer_made: { verb: 'made an offer', actorLabel: 'Offerer', counterpartyLabel: 'Owner' },
  bought: { verb: 'bought', actorLabel: 'Buyer', counterpartyLabel: 'Seller' },
  sold: { verb: 'sold', actorLabel: 'Seller', counterpartyLabel: 'Buyer' },
  offer_accepted: { verb: 'accepted offer', actorLabel: 'Offerer', counterpartyLabel: 'Offerer' },
  offer_cancelled: { verb: 'cancelled offer', actorLabel: 'Cancelled by' },
  listing_cancelled: { verb: 'cancelled listing', actorLabel: 'Cancelled by' },
  mint: { verb: 'minted', actorLabel: 'Minted by' },
  sent: { verb: 'sent', actorLabel: 'From', counterpartyLabel: 'To' },
  received: { verb: 'received', actorLabel: 'From', counterpartyLabel: 'To' },
  renewal: { verb: 'extended', actorLabel: 'Extended by' },
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
  const { width } = useWindowSize()
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
          <div className='flex min-w-0 flex-wrap items-center gap-2'>
            {/* <p className='text-neutral text-sm font-bold tracking-wide uppercase'>
                {activity.platform || 'ENS'} Activity
                </p> */}
            <div className='flex'>
              {activity.actor_address && (
                <User
                  address={activity.actor_address}
                  wrapperClassName='justify-start'
                  className='max-w-full py-1'
                  avatarSize={width && width < 768 ? '22px' : '26px'}
                />
              )}
            </div>
            <p className='text-foreground/80 text-lg font-semibold'>{copy.verb}</p>
            <HoverPrefetchLink
              href={namePagePath}
              onClick={(e) => e.stopPropagation()}
              className='hover:text-primary flex items-center gap-1.5 font-bold transition-colors'
            >
              <NameImage
                name={normalizedName}
                tokenId={tokenId}
                expiryDate={null}
                forceRegStatus={REGISTERED}
                className='h-7 w-7 rounded-sm sm:h-9 sm:w-9 md:rounded-md'
              />
              {beautifyName(normalizedName)}
            </HoverPrefetchLink>
          </div>
          <span className='text-neutral shrink-0 text-xs font-medium whitespace-nowrap'>{time}</span>
        </div>

        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {activity.platform && (
            <div className='bg-background/50 rounded-md p-2'>
              <p className='text-neutral mb-1 text-xs font-bold tracking-wide uppercase'>Source</p>
              <div className='flex flex-row items-center gap-1'>
                <Image
                  src={SOURCE_ICONS[activity.platform as keyof typeof SOURCE_ICONS]}
                  alt={activity.platform}
                  width={16}
                  height={16}
                />
                <p className='text-foreground/80 text-xl font-semibold capitalize'>{activity.platform}</p>
              </div>
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
