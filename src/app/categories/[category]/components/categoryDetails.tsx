import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import PrepunksAvatar from 'public/clubs/prepunks/avatar.png'
import PrepunksHeader from 'public/clubs/prepunks/header.jpeg'
import TenKAvatar from 'public/clubs/10k/avatar.jpg'
import TenKHeader from 'public/clubs/10k/header.jpeg'
import PokemonAvatar from 'public/clubs/pokemon/avatar.jpg'
import PokemonHeader from 'public/clubs/pokemon/header.jpeg'
import OneKForenamesAvatar from 'public/clubs/1kforenames/avatar.jpg'
import OneKForenamesHeader from 'public/clubs/1kforenames/header.png'
import OneKSurnamesAvatar from 'public/clubs/1ksurnames/avatar.jpg'
import OneKSurnamesHeader from 'public/clubs/1ksurnames/header.png'
import NineNinetyNineAvatar from 'public/clubs/999/avatar.jpg'
import NineNinetyNineHeader from 'public/clubs/999/header.jpeg'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import TwitterIcon from 'public/logos/x.svg'
import { localizeNumber } from '@/utils/localizeNumber'

export const CATEGORY_IMAGES = {
  prepunks: {
    avatar: PrepunksAvatar,
    header: PrepunksHeader,
  },
  '10k': {
    avatar: TenKAvatar,
    header: TenKHeader,
  },
  pokemon: {
    avatar: PokemonAvatar,
    header: PokemonHeader,
  },
  '1kforenames': {
    avatar: OneKForenamesAvatar,
    header: OneKForenamesHeader,
  },
  '1ksurnames': {
    avatar: OneKSurnamesAvatar,
    header: OneKSurnamesHeader,
  },
  '999': {
    avatar: NineNinetyNineAvatar,
    header: NineNinetyNineHeader,
  },
}

export const CATEGORY_SOCIAL_LINKS = {
  prepunks: {
    twitter: 'https://twitter.com/PrePunkOfficial',
  },
  '10k': {
    twitter: 'https://twitter.com/10kClubOfficial',
  },
  pokemon: {
    twitter: 'https://twitter.com/PokemonENS',
  },
  '1kforenames': {
    twitter: null,
  },
  '1ksurnames': {
    twitter: null,
  },
  '999': {
    twitter: 'https://twitter.com/ens999club',
  },
}

interface Props {
  categoryDetails: CategoryType
}

const CategoryDetails = ({ categoryDetails }: Props) => {
  const categoryName = CATEGORY_LABELS[categoryDetails.name as keyof typeof CATEGORY_LABELS]
  const categoryImage = CATEGORY_IMAGES[categoryDetails.name as keyof typeof CATEGORY_IMAGES]
  const twitterLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS].twitter

  return (
    <div className='relative w-full items-center justify-center px-4'>
      <Image
        src={categoryImage.header}
        alt={`${categoryName} header`}
        width={1000}
        height={1000}
        className='bg-foreground absolute top-0 left-0 h-full w-full object-cover opacity-20'
      />
      <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-between gap-4 md:gap-8 py-10 md:flex-row'>
        <div className='flex items-start gap-4'>
          <Image
            src={categoryImage.avatar}
            alt={`${categoryName} avatar`}
            width={100}
            height={100}
            className='md:w-24 md:h-24 w-16 h-16 rounded-full object-cover'
          />
          <div className='flex flex-col gap-2'>
            <p className='text-3xl md:text-4xl lg:text-5xl font-bold'>{categoryName}</p>
            <p className='text-neutral text-xl md:text-2xl font-medium'>{categoryDetails.description}</p>
            <div className='flex items-center gap-2'>
              {twitterLink && (
                <Link href={twitterLink} target='_blank' rel='noopener noreferrer'>
                  <Image
                    src={TwitterIcon}
                    alt='Twitter'
                    width={32}
                    height={32}
                    className='transition-opacity hover:opacity-70'
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className='bg-background p-lg border-tertiary flex w-full flex-col items-center gap-2 rounded-md border-2 md:w-72'>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Names</p>
            <p className='text-xl font-semibold'>{localizeNumber(categoryDetails.member_count)}</p>
          </div>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Floor Price</p>
            <Price
              price={categoryDetails.floor_price_wei}
              currencyAddress={categoryDetails.floor_price_currency as Address}
              iconSize='18px'
              fontSize='font-semibold text-xl'
            />
          </div>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Total Sales</p>
            <p className='text-xl font-semibold'>{localizeNumber(categoryDetails.total_sales_count)}</p>
          </div>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Total Sales Volume</p>
            <Price
              price={categoryDetails.total_sales_volume_wei}
              currencyAddress={categoryDetails.floor_price_currency as Address}
              iconSize='18px'
              fontSize='font-semibold text-xl'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryDetails
