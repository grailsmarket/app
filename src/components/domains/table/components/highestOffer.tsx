import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import Image from 'next/image'
import ethGray from 'public/icons/eth-gray.svg'

interface HighestOfferProps {
  domain: MarketplaceDomainType
  columnCount: number
}

const HighestOffer: React.FC<HighestOfferProps> = ({ domain, columnCount }) => {
  const highestOffer = domain.highest_offer

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['highest_offer'].getWidth(columnCount))}>
      {highestOffer && (
        <div className='flex'>
          <Image src={ethGray} alt='ETH' className='h-[14px] w-auto' />
          <p className='text-light-600 ml-1 text-xs font-medium'>{formatEtherPrice(highestOffer || '0') || null}</p>
        </div>
      )}
    </div>
  )
}

export default HighestOffer
