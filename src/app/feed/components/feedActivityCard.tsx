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
import { useAppContainerWidth } from '@/hooks/useAppContainerWidth'
import { SOURCE_ICONS, SOURCE_LABELS } from '@/constants/domains/sources'
import Image from 'next/image'
import ETHERSCAN_ICON from 'public/logos/etherscan.svg'
import { formatDuration } from '@/utils/time/formatDuration'

interface FeedActivityCardProps {
  activity: ActivityType
  onReply?: (name: string) => void
}

const EVENT_COPY: Record<
  ProfileActivityEventType,
  { verb: string; actorLabel: string; counterpartyLabel?: string; counterpartyPreposition?: string }
> = {
  registration: { verb: 'registered', actorLabel: 'Registered by' },
  sale: { verb: 'sold', actorLabel: 'Seller', counterpartyLabel: 'Buyer', counterpartyPreposition: 'to' },
  offer: {
    verb: 'received an offer',
    actorLabel: 'Offer from',
    counterpartyLabel: 'Offerer',
    counterpartyPreposition: 'from',
  },
  listed: { verb: 'listed', actorLabel: 'Listed by' },
  offer_made: {
    verb: 'made an offer',
    actorLabel: 'Offerer',
    counterpartyLabel: 'Owner',
    counterpartyPreposition: 'to',
  },
  bought: { verb: 'bought', actorLabel: 'Buyer', counterpartyLabel: 'Seller', counterpartyPreposition: 'from' },
  sold: { verb: 'sold', actorLabel: 'Seller', counterpartyLabel: 'Buyer', counterpartyPreposition: 'to' },
  offer_accepted: {
    verb: 'accepted offer',
    actorLabel: 'Offerer',
    counterpartyLabel: 'Offerer',
    counterpartyPreposition: 'from',
  },
  offer_cancelled: { verb: 'cancelled offer', actorLabel: 'Cancelled by' },
  listing_cancelled: { verb: 'cancelled listing', actorLabel: 'Cancelled by' },
  mint: { verb: 'minted', actorLabel: 'Minted by' },
  sent: { verb: 'sent', actorLabel: 'From', counterpartyLabel: 'To', counterpartyPreposition: 'to' },
  received: { verb: 'received', actorLabel: 'From', counterpartyLabel: 'To', counterpartyPreposition: 'from' },
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
  const width = useAppContainerWidth()
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
  const duration = activity.metadata?.duration_seconds
    ? formatDuration(activity.metadata?.duration_seconds as number)
    : undefined

  return (
    <article
      onClick={() => router.push(namePagePath)}
      className='bg-secondary border-tertiary hover:border-foreground/30 cursor-pointer rounded-lg border-2 p-3 shadow-sm transition-colors @[40rem]/app:px-4'
    >
      <div className='flex flex-col gap-3'>
        <div className='flex flex-col gap-3 @[40rem]/app:flex-row @[40rem]/app:items-start @[40rem]/app:justify-between'>
          <div className='flex min-w-0 flex-wrap items-center gap-2'>
            {/* <p className='text-neutral text-sm font-bold tracking-wide uppercase'>
                {activity.platform || 'ENS'} Activity
                </p> */}
            <div className='flex'>
              {activity.actor_address && (
                <User
                  address={activity.actor_address}
                  wrapperClassName='justify-start'
                  className='max-w-full py-[3px] @[40rem]/app:py-1'
                  avatarSize={width && width < 768 ? '20px' : '24px'}
                  alignTooltip='left'
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
                className='h-6.5 w-6.5 rounded-sm @[40rem]/app:h-8 @[40rem]/app:w-8 @[48rem]/app:rounded-md'
              />
              {beautifyName(normalizedName)}
            </HoverPrefetchLink>
          </div>
          <span className='text-neutral hidden shrink-0 text-xs font-medium whitespace-nowrap @[40rem]/app:block'>
            {time}
          </span>
        </div>

        <div className='flex flex-row items-end justify-between'>
          {/* Activity details as a single sentence-style line to keep the card as compact as a comment */}
          <div className='text-foreground/80 flex w-full max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 text-lg font-medium @[40rem]/app:max-w-[calc(100%-72px)]'>
            {copy.counterpartyLabel && activity.counterparty_address && (
              <>
                <span className='text-neutral'>{copy.counterpartyPreposition ?? 'with'}</span>
                <User
                  address={activity.counterparty_address}
                  wrapperClassName='justify-start w-fit max-w-fit'
                  className='max-w-full'
                />
              </>
            )}
            {duration && (
              <>
                <span className='text-neutral'>for</span>
                <span className='font-semibold'>{duration}</span>
              </>
            )}
            {hasPrice && (
              <>
                <span className='text-neutral'>{duration ? 'at' : 'for'}</span>
                <Price price={activity.price_wei} currencyAddress={activity.currency_address || ETH_ADDRESS} />
              </>
            )}
            {activity.platform && (
              <>
                <span className='text-neutral'>on</span>
                <span className='flex items-center gap-1 font-semibold'>
                  <Image
                    src={SOURCE_ICONS[activity.platform as keyof typeof SOURCE_ICONS]}
                    alt={activity.platform}
                    width={activity.platform === 'blockchain' ? 12 : 17}
                    height={activity.platform === 'blockchain' ? 12 : 17}
                  />
                  {SOURCE_LABELS[activity.platform as keyof typeof SOURCE_LABELS] ?? (
                    <span className='capitalize'>{activity.platform}</span>
                  )}
                </span>
              </>
            )}
            {activity.transaction_hash && (
              <>
                <span className='text-neutral'>·</span>
                <Link
                  href={`https://etherscan.io/tx/${activity.transaction_hash}`}
                  target='_blank'
                  onClick={(e) => e.stopPropagation()}
                  className='text-neutral hover:text-foreground flex items-center gap-1 transition-colors'
                >
                  <Image src={ETHERSCAN_ICON} alt='Etherscan' width={18} height={18} />
                  {/* {truncateAddress(activity.transaction_hash as Address)} */}
                </Link>
              </>
            )}
          </div>
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
              className='text-primary text-md hidden cursor-pointer items-center gap-1 pb-1 font-bold transition-opacity hover:opacity-80 @[40rem]/app:inline-flex'
            >
              Reply <ReplyArrowIcon />
            </button>
          ) : (
            <span />
          )}
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
        </div>
      </div>
    </article>
  )
}

export default FeedActivityCard
