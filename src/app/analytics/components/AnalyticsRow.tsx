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
import EthGray from 'public/icons/eth-gray.svg'
import { AnalyticsListing, AnalyticsOffer, AnalyticsRegistration, AnalyticsSale } from '@/types/analytics'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { ETH_ADDRESS } from '@/constants/web3/tokens'
import { useCategories } from '@/components/filters/hooks/useCategories'

interface SourceIconProps {
  source: string
}

const SourceIcon: React.FC<SourceIconProps> = ({ source }) => {
  const icon = source === 'opensea' ? OpenSea : source === 'grails' ? Grails : EthGray

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
  const { categories } = useCategories()
  const category =
    listing.clubs && listing.clubs.length > 0 ? categories?.find((c) => c.name === listing.clubs?.[0]) : null
  const categoryDetails = category ? getCategoryDetails(category.name) : null

  return (
    <Link
      href={`/${normalizeName(listing.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-3 border-b px-2 transition sm:px-3',
        index === 0 && 'border-t'
      )}
    >
      <div className='flex w-[45%] max-w-[45%] flex-row items-center gap-2'>
        <SourceIcon source={listing.source} />
        <NameImage name={listing.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <div className='max-w-[calc(100%-60px)] truncate'>
          <p className='text-md max-w-full truncate font-semibold'>{beautifyName(listing.name)}</p>
          {category && categoryDetails && (
            <div className='text-md text-foreground/60 flex items-center gap-1 font-semibold text-nowrap'>
              <Image
                src={categoryDetails.avatar}
                alt={category.display_name}
                width={16}
                height={16}
                className='rounded-full'
              />
              <p>{category.display_name}</p>
              <p className='ml-0.5'>{listing.clubs && listing.clubs.length > 1 && `+${listing.clubs.length - 1}`}</p>
            </div>
          )}
        </div>
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
  const { categories } = useCategories()
  const category = offer.clubs && offer.clubs.length > 0 ? categories?.find((c) => c.name === offer.clubs?.[0]) : null
  const categoryDetails = category ? getCategoryDetails(category.name) : null

  return (
    <Link
      href={`/${normalizeName(offer.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-3 border-b px-2 transition sm:px-3',
        index === 0 && 'border-t'
      )}
    >
      <div className='flex w-[45%] flex-row items-center gap-2'>
        <SourceIcon source={offer.source} />
        <NameImage name={offer.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <div className='w-full max-w-[calc(100%-60px)] truncate'>
          <p className='text-md max-w-full truncate font-semibold'>{beautifyName(offer.name)}</p>
          {category && categoryDetails && (
            <div className='text-md text-foreground/60 flex items-center gap-1 font-semibold text-nowrap'>
              <Image
                src={categoryDetails.avatar}
                alt={category.display_name}
                width={16}
                height={16}
                className='rounded-full'
              />
              <p>{category.display_name}</p>
              <p className='ml-0.5'>{offer.clubs && offer.clubs.length > 1 && `+${offer.clubs.length - 1}`}</p>
            </div>
          )}
        </div>{' '}
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
  hideSeller?: boolean
  className?: string
}

export const SaleRow: React.FC<SaleRowProps> = ({ sale, index, hideSeller = false, className }) => {
  const { categories } = useCategories()
  const category = sale.clubs && sale.clubs.length > 0 ? categories?.find((c) => c.name === sale.clubs?.[0]) : null
  const categoryDetails = category ? getCategoryDetails(category.name) : null

  return (
    <Link
      href={`/${normalizeName(sale.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-1 border-b px-2 transition sm:px-3',
        className,
        index === 0 && 'border-t'
      )}
    >
      <div className={cn('flex flex-row items-center gap-2', hideSeller ? 'w-[50%]' : 'w-[40%]')}>
        <SourceIcon source={sale.source} />
        <NameImage name={sale.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <div className='w-full max-w-[calc(100%-60px)] truncate'>
          <p className='text-md max-w-full truncate font-semibold'>{beautifyName(sale.name)}</p>
          {category && categoryDetails && (
            <div className='text-md text-foreground/60 flex items-center gap-1 font-semibold text-nowrap'>
              <Image
                src={categoryDetails.avatar}
                alt={category.display_name}
                width={16}
                height={16}
                className='rounded-full'
              />
              <p>{category.display_name}</p>
              <p className='ml-0.5'>{sale.clubs && sale.clubs.length > 1 && `+${sale.clubs.length - 1}`}</p>
            </div>
          )}
        </div>
      </div>
      <div className='flex w-[20%] max-w-[20%] flex-1 items-center'>
        <Price
          price={sale.sale_price_wei}
          currencyAddress={sale.currency_address as Address}
          fontSize='text-md font-medium'
          iconSize='16px'
        />
      </div>
      {!hideSeller && (
        <div className='w-[20%]'>
          <User address={sale.seller_address as Address} className='max-w-[99%]' wrapperClassName='justify-end' />
        </div>
      )}
      <div className={cn(hideSeller ? 'w-[30%]' : 'w-[20%]')}>
        <User address={sale.buyer_address as Address} className='max-w-[99%]' wrapperClassName='justify-end' />
      </div>
    </Link>
  )
}

interface RegistrationRowProps {
  registration: AnalyticsRegistration
  index: number
  className?: string
}

export const RegistrationRow: React.FC<RegistrationRowProps> = ({ registration, index, className }) => {
  const { categories } = useCategories()
  const category =
    registration.clubs && registration.clubs.length > 0
      ? categories?.find((c) => c.name === registration.clubs?.[0])
      : null
  const categoryDetails = category ? getCategoryDetails(category.name) : null

  return (
    <Link
      href={`/${normalizeName(registration.name)}`}
      className={cn(
        'group border-tertiary hover:bg-foreground/10 flex h-[52px] w-full flex-row items-center gap-3 border-b px-2 transition sm:px-3',
        className,
        index === 0 && 'border-t'
      )}
    >
      <div className='flex w-[45%] flex-row items-center gap-2'>
        <NameImage name={registration.name} tokenId='' expiryDate={null} className='h-8 w-8 flex-shrink-0 rounded-sm' />
        <div className='w-full max-w-[calc(100%-34px)] truncate'>
          <p className='text-md max-w-full truncate font-semibold'>{beautifyName(registration.name)}</p>
          {category && categoryDetails && (
            <div className='text-md text-foreground/60 flex items-center gap-1 font-semibold text-nowrap'>
              <Image
                src={categoryDetails.avatar}
                alt={category.display_name}
                width={16}
                height={16}
                className='rounded-full'
              />
              <p>{category.display_name}</p>
              <p className='ml-0.5'>
                {registration.clubs && registration.clubs.length > 1 && `+${registration.clubs.length - 1}`}
              </p>
            </div>
          )}
        </div>{' '}
      </div>
      <div className='flex w-[20%] flex-1 items-center'>
        <Price
          price={registration.total_cost_wei}
          currencyAddress={ETH_ADDRESS}
          fontSize='text-md font-medium'
          iconSize='16px'
        />
      </div>
      <div className='w-[30%]'>
        <User address={registration.owner_address as Address} className='max-w-[95%]' wrapperClassName='justify-end' />
      </div>
    </Link>
  )
}
