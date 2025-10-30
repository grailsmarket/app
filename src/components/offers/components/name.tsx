import React from 'react'
import Link from 'next/link'
import { DomainOfferType } from '@/types/domains'

interface NameProps {
  offer: DomainOfferType
}

const Name: React.FC<NameProps> = ({ offer }) => {
  // Extract name from the offer data
  const name = offer.order_data?.item?.metadata?.name || 'Unknown'

  return (
    <Link href={`/${name}`} className='transition-opacity hover:opacity-80'>
      <p className='truncate text-sm font-medium text-white'>{name}</p>
    </Link>
  )
}

export default Name
