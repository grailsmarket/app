'use client'

import React, { useState } from 'react'
import { DomainOfferType } from '@/types/domains'
import NameImage from '@/components/ui/nameImage'
import Link from 'next/link'
import { normalizeName, beautifyName } from '@/lib/ens'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import ArrowDownIcon from 'public/icons/arrow-down.svg'

interface NameProps {
  offer: DomainOfferType
}

const Name: React.FC<NameProps> = ({ offer }) => {
  const [expanded, setExpanded] = useState(false)
  const isNOfMany = offer.offer_type === 'n_of_many' && offer.n_of_many_target_count
  const names = offer.n_of_many_names

  if (isNOfMany && names && names.length > 0) {
    const target = offer.n_of_many_target_count!
    const total = offer.n_of_many_total_items!
    const fulfilled = offer.n_of_many_fulfilled_count ?? 0
    const remaining = target - fulfilled

    return (
      <div className='flex flex-col'>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className='flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80'
        >
          <div className='bg-primary/20 text-primary flex h-8 min-w-8 items-center justify-center rounded-sm text-xs font-bold'>
            {remaining}/{target}
          </div>
          <div className='flex flex-col items-start'>
            <p className='truncate text-sm font-medium text-white'>
              {target} of {total} names
            </p>
          </div>
          <Image
            src={ArrowDownIcon}
            alt='expand'
            width={12}
            height={12}
            className={cn('transition-transform', expanded && 'rotate-180')}
          />
        </button>
        {expanded && (
          <div className='mt-1 flex flex-col gap-0.5 pl-10'>
            {names.map((name) => (
              <Link
                key={name}
                href={`/${normalizeName(name)}`}
                className='text-primary truncate text-xs hover:underline'
              >
                {beautifyName(name)}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Standard single-name offer
  const name = offer.name || 'Unknown'

  return (
    <Link href={`/${normalizeName(name)}`} className='flex items-center gap-2 transition-opacity hover:opacity-80'>
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
