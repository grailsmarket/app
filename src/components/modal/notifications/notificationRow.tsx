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
// import Expired from 'public/icons/expiring.svg' // Using burn icon for expiration
import NameImage from '@/components/ui/nameImage'

interface NotificationRowProps {
  notification: Notification
  onClick?: () => void
}

const NotificationRow: React.FC<NotificationRowProps> = ({ notification, onClick }) => {
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
        return 'Offer received'
      case 'sale':
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
          <Price price={price} currencyAddress={TOKEN_ADDRESSES.ETH} />
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

  return (
    <Link
      href={`/${notification.ensName}`}
      className={cn(
        'flex items-center w-full justify-between gap-4 p-lg hover:bg-white/5 transition-colors cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 w-2/5">
        {!notification.isRead && <div className="w-2 h-2 rounded-full bg-primary" />}
        <div className=''>
          <Image src={icon} alt={eventName} width={26} height={26} />
        </div>
        <div className="flex flex-col gap-px">
          <p className="text-lg font-medium text-foreground">{eventName}</p>
          <div className="text-md font-medium text-neutral">{timeAgo}</div>
        </div>
      </div>

      <div className="w-2/5 flex items-center gap-2">
        <NameImage name={notification.ensName} tokenId={notification.ensTokenId} expiryDate={new Date().toISOString()} height={32} width={32} />
        <span className="text-foreground font-semibold">{notification.ensName}</span>
      </div>

      <div className="w-1/5 flex justify-end">
        {getContextualData()}
      </div>

      {/* {!notification.isRead && (
        <div className="w-2 h-2 absolute top-[26px] left-2 rounded-full bg-primary" />
      )} */}
    </Link>
  )
}

export default NotificationRow