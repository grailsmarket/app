'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const isNOfMany = offer.offer_type === 'n_of_many' && offer.n_of_many_target_count
  const names = offer.n_of_many_names

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  if (isNOfMany && names && names.length > 0) {
    const target = offer.n_of_many_target_count!
    const total = offer.n_of_many_total_items!
    const fulfilled = offer.n_of_many_fulfilled_count ?? 0
    const remaining = target - fulfilled

    return (
      <div className='relative' ref={popoverRef}>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setOpen(!open)
          }}
          className='flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80'
        >
          <div className='bg-primary/20 text-primary flex h-8 min-w-8 items-center justify-center rounded-sm text-xs font-bold'>
            {remaining}/{target}
          </div>
          <p className='truncate text-sm font-medium text-white'>
            {target} of {total} names
          </p>
          <Image
            src={ArrowDownIcon}
            alt='expand'
            width={12}
            height={12}
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className='border-tertiary bg-background absolute top-full left-0 z-50 mt-1 flex max-h-64 w-64 flex-col overflow-y-auto rounded-md border shadow-lg'>
            {names.map((name) => (
              <Link
                key={name}
                href={`/${normalizeName(name)}`}
                onClick={() => setOpen(false)}
                className='hover:bg-secondary flex items-center gap-2 px-3 py-2 transition-colors'
              >
                <NameImage
                  name={name}
                  tokenId=''
                  expiryDate={new Date().toISOString()}
                  className='h-6 w-6 rounded-sm'
                />
                <p className='truncate text-sm text-white'>{beautifyName(name)}</p>
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
