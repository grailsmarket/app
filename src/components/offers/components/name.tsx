'use client'

import React, { useState } from 'react'
import { DomainOfferType } from '@/types/domains'
import NameImage from '@/components/ui/nameImage'
import Link from 'next/link'
import { normalizeName } from '@/lib/ens'

interface NameProps {
  offer: DomainOfferType
}

const Name: React.FC<NameProps> = ({ offer }) => {
  // Extract name from the offer data
  const name = offer.name || 'Unknown'
  const [prefetch, setPrefetch] = useState(false)

  return (
    <Link
      href={`/${normalizeName(name)}`}
      className='flex items-center gap-2 transition-opacity hover:opacity-80'
      prefetch={prefetch}
      onMouseEnter={() => setPrefetch(true)}
    >
      <NameImage
        name={name}
        tokenId={offer.token_id}
        expiryDate={new Date().toISOString()}
        className='h-8 w-8 rounded-sm'
      />
      <p className='truncate text-sm font-medium text-white'>{name}</p>
    </Link>
  )
}

export default Name
