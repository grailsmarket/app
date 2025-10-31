import React from 'react'
import Link from 'next/link'
import { DomainOfferType } from '@/types/domains'
import { DOMAIN_IMAGE_URL } from '@/constants'
import Image from 'next/image'
import { numberToHex } from 'viem'

interface NameProps {
  offer: DomainOfferType
}

const Name: React.FC<NameProps> = ({ offer }) => {
  // Extract name from the offer data
  const name = offer.name || 'Unknown'

  return (
    <Link href={`/${name}`} className='flex items-center gap-2 transition-opacity hover:opacity-80'>
      <Image
        src={`${DOMAIN_IMAGE_URL}/${numberToHex(offer.token_id)}/image`}
        unoptimized
        alt='icon'
        width={30}
        height={30}
        className='h-8 w-8 rounded-sm'
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />{' '}
      <p className='truncate text-sm font-medium text-white'>{name}</p>
    </Link>
  )
}

export default Name
