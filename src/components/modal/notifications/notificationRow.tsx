'use client'

import React from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { Notification, NotificationType } from '@/types/notifications'
import { cn } from '@/utils/tailwind'
import Link from 'next/link'
import Price from '@/components/ui/price'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
// Icons
import Listed from 'public/icons/listed.svg'
import OfferMade from 'public/icons/bid.svg'
import Sold from 'public/icons/sold.svg'
import PriceChange from 'public/icons/transfer.svg'
import Bell from 'public/icons/bell.svg'
// import Expired from 'public/icons/expiring.svg' // Using burn icon for expiration
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'

interface NotificationRowProps {
  notification: Notification
  onClick?: () => void
  index: number
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onClick, index }) => {
  // Get icon based on notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'new-listing':
        return Listed
      case 'new-offer':
        return OfferMade
      case 'sale':
        return Sold
      case 'price-change':
        return PriceChange
      default:
        return Listed
    }
  }

  // Get event name
  const getEventName = (type: NotificationType) => {
    switch (type) {
      case 'new-listing':
        return 'Listed'
      case 'new-offer':
        return 'Offer'
      case 'offer-received':
        return 'Offer received'
      case 'sale':
        return 'Sold'
      case 'listing-sold':
        return 'Sold'
      case 'price-change':
        return 'Price changed'
      default:
        return type
    }
  }

  // Format the contextual data (price or date)
  const getContextualData = () => {
    const { metadata, type } = notification

    if (type === 'sale' || type === 'new-listing' || type === 'new-offer' || type === 'price-change') {
      const price = metadata.priceWei || metadata.offerAmountWei
      if (price) {
        return (
          <Price
            price={price}
            currencyAddress={TOKEN_ADDRESSES.ETH}
            alignTooltip='right'
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
          />
        )
      }
    }

    // if (type === 'price-change') {
    //   if (metadata.priceWei && metadata.previousPriceWei) {
    //     const newPrice = formatEther(BigInt(metadata.priceWei))
    //     const oldPrice = formatEther(BigInt(metadata.previousPriceWei))
    //     return (
    //       <div className="flex items-center gap-1 text-orange-500">
    //         <span className="text-sm line-through opacity-60">Ξ{Number(oldPrice).toFixed(2)}</span>
    //         <span>→</span>
    //         <span>Ξ{Number(newPrice).toFixed(2)}</span>
    //       </div>
    //     )
    //   }
    // }

    return null
  }

  const icon = getIcon(notification.type)
  const eventName = getEventName(notification.type)
  const timeAgo = formatDistanceToNow(new Date(notification.sentAt), { addSuffix: true }).replace('about ', '')

  if (notification.type === 'admin-broadcast') {
    const title = notification.metadata.title || 'Announcement'
    const body = notification.metadata.body || ''
    const linkUrl = notification.metadata.linkUrl
    const isExternal = !!linkUrl && /^https?:\/\//i.test(linkUrl)
    const className = cn(
      'p-md sm:p-lg flex min-h-16 w-full items-start justify-between gap-4 transition-colors hover:bg-white/5',
      linkUrl ? 'cursor-pointer' : 'cursor-default'
    )

    const content = (
      <>
        <div className='flex w-2/5 items-start gap-2 sm:gap-3'>
          {!notification.isRead && <div className='bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full' />}
          <div className='mt-0.5 flex-shrink-0'>
            <Image src={Bell} alt='Announcement' width={26} height={26} className='h-5 w-5 sm:h-6 sm:w-6' />
          </div>
          <div className='flex min-w-0 flex-col gap-px'>
            <p className='text-foreground text-md font-medium break-words sm:text-lg'>{title}</p>
            <div className='sm:text-md text-neutral text-sm font-medium'>{timeAgo}</div>
          </div>
        </div>
        <div className='flex min-w-0 flex-1 items-start py-0.5'>
          <p className='sm:text-md text-neutral text-sm break-words whitespace-pre-wrap'>{body}</p>
        </div>
      </>
    )

    if (linkUrl) {
      return isExternal ? (
        <a href={linkUrl} target='_blank' rel='noopener noreferrer' className={className} onClick={onClick}>
          {content}
        </a>
      ) : (
        <Link href={linkUrl} className={className} onClick={onClick}>
          {content}
        </Link>
      )
    }
    return (
      <div className={className} onClick={onClick}>
        {content}
      </div>
    )
  }

  return (
    <Link
      href={`/${notification.ensName}`}
      className={cn(
        'p-md sm:p-lg flex max-h-16 w-full cursor-pointer items-center justify-between gap-4 transition-colors hover:bg-white/5'
      )}
      onClick={onClick}
    >
      <div className='flex w-2/5 items-center gap-2 sm:gap-3'>
        {!notification.isRead && <div className='bg-primary h-2 w-2 rounded-full' />}
        <div className=''>
          <Image src={icon} alt={eventName} width={26} height={26} className='h-5 w-5 sm:h-6 sm:w-6' />
        </div>
        <div className='flex flex-col gap-px'>
          <p className='text-foreground text-md font-medium sm:text-lg'>{eventName}</p>
          <div className='sm:text-md text-neutral text-sm font-medium'>{timeAgo}</div>
        </div>
      </div>

      <div className='flex w-2/5 items-center gap-1.5 sm:gap-2'>
        <NameImage
          name={notification.ensName ?? ''}
          tokenId={notification.ensTokenId ?? ''}
          expiryDate={new Date().toISOString()}
          height={32}
          width={32}
        />
        <span className='text-foreground text-lg font-semibold sm:text-xl'>
          {beautifyName(notification.ensName ?? '')}
        </span>
      </div>

      <div className='flex w-1/5 justify-end'>{getContextualData()}</div>

      {/* {!notification.isRead && (
        <div className="w-2 h-2 absolute top-[26px] left-2 rounded-full bg-primary" />
      )} */}
    </Link>
  )
}

export default NotificationRow
