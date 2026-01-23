'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import { cn } from '@/utils/tailwind'
import { normalizeName, beautifyName } from '@/lib/ens'
import Price from '@/components/ui/price'
import User from '@/components/ui/user'
import NameImage from '@/components/ui/nameImage'
import OpenSea from 'public/logos/opensea.svg'
import Grails from 'public/logo.png'
import { AnalyticsListing, AnalyticsOffer, AnalyticsSale } from '@/types/analytics'

interface SourceIconProps {
  source: string
}

const SourceIcon: React.FC<SourceIconProps> = ({ source }) => {
  const icon = source === 'opensea' ? OpenSea : source === 'grails' ? Grails : null

  if (!icon) return <div className='h-6 w-6' />

  return (
    <div className='flex h-6 w-6 flex-shrink-0 items-center justify-center'>
      <Image src={icon} alt={source} width={24} height={24} className='h-full w-auto' />
    </div>
  )
}

interface ListingRowProps {
  listing: AnalyticsListing
  index: number
}

export const ListingRow: React.FC<ListingRowProps> = ({ listing, index }) => {
  return (
    <Link
      href={`/${normalizeName(listing.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-3 border-b px-3 transition',
        index === 0 && 'border-t'
      )}
    >
      <div className='flex w-[45%] max-w-[45%] flex-row items-center gap-2'>
        <SourceIcon source={listing.source} />
        <NameImage name={listing.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <p className='text-md max-w-[100%-60px] truncate font-semibold'>{beautifyName(listing.name)}</p>
      </div>
      <div className='flex w-[20%] max-w-[20%] flex-1 items-center'>
        <Price
          price={listing.price_wei}
          currencyAddress={listing.currency_address as Address}
          fontSize='text-sm font-medium'
          iconSize='14px'
        />
      </div>
      <div className='w-[30%]'>
        <User address={listing.seller_address as Address} className='max-w-[95%]' wrapperClassName='justify-end' />
      </div>
    </Link>
  )
}

interface OfferRowProps {
  offer: AnalyticsOffer
  index: number
}

export const OfferRow: React.FC<OfferRowProps> = ({ offer, index }) => {
  return (
    <Link
      href={`/${normalizeName(offer.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-3 border-b px-3 transition',
        index === 0 && 'border-t'
      )}
    >
      <div className='flex w-[45%] flex-row items-center gap-2'>
        <SourceIcon source={offer.source} />
        <NameImage name={offer.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <p className='text-md max-w-[100%-60px] truncate font-semibold'>{beautifyName(offer.name)}</p>
      </div>
      <div className='flex w-[20%] flex-1 items-center'>
        <Price
          price={offer.offer_amount_wei}
          currencyAddress={offer.currency_address as Address}
          fontSize='text-md font-medium'
          iconSize='16px'
        />
      </div>
      <div className='w-[30%]'>
        <User address={offer.buyer_address as Address} className='max-w-[95%]' wrapperClassName='justify-end' />
      </div>
    </Link>
  )
}

interface SaleRowProps {
  sale: AnalyticsSale
  index: number
}

export const SaleRow: React.FC<SaleRowProps> = ({ sale, index }) => {
  return (
    <Link
      href={`/${normalizeName(sale.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-1 border-b px-3 transition',
        index === 0 && 'border-t'
      )}
    >
      <div className='flex w-[40%] flex-row items-center gap-2'>
        <SourceIcon source={sale.source} />
        <NameImage name={sale.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <p className='text-md max-w-[100%-60px] truncate font-semibold'>{beautifyName(sale.name)}</p>
      </div>
      <div className='flex w-[20%] max-w-[20%] flex-1 items-center'>
        <Price
          price={sale.sale_price_wei}
          currencyAddress={sale.currency_address as Address}
          fontSize='text-md font-medium'
          iconSize='16px'
        />
      </div>
      <div className='w-[20%]'>
        <User address={sale.seller_address as Address} className='max-w-[99%]' wrapperClassName='justify-end' />
      </div>
      <div className='w-[20%]'>
        <User address={sale.buyer_address as Address} className='max-w-[99%]' wrapperClassName='justify-end' />
      </div>
    </Link>
  )
}
