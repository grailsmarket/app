import Price from '@/components/ui/price'
import { ClubType } from '@/types/domains'
import Image from 'next/image'
import React from 'react'
import { Address } from 'viem'
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
import { CLUB_LABELS } from '@/constants/domains/marketplaceDomains'
import TwitterIcon from 'public/logos/x.svg'
import Link from 'next/link'

export const CLUB_IMAGES = {
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

export const CLUB_SOCIAL_LINKS = {
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
  clubDetails: ClubType
}

const ClubDetails = ({ clubDetails }: Props) => {
  const clubName = CLUB_LABELS[clubDetails.name as keyof typeof CLUB_LABELS]
  const clubImage = CLUB_IMAGES[clubDetails.name as keyof typeof CLUB_IMAGES]
  const twitterLink = CLUB_SOCIAL_LINKS[clubDetails.name as keyof typeof CLUB_SOCIAL_LINKS].twitter

  return (
    <div className='relative w-full translate-y-20 px-4 items-center justify-center'>
      <Image
        src={clubImage.header}
        alt={`${clubName} header`}
        width={1000}
        height={1000}
        className='bg-foreground absolute top-0 left-0 h-full w-full object-cover opacity-20'
      />
      <div className='relative z-10 mx-auto flex w-full max-w-7xl justify-between pt-10 pb-30'>
        <div className='flex items-start gap-4'>
          <Image
            src={clubImage.avatar}
            alt={`${clubName} avatar`}
            width={100}
            height={100}
            className='rounded-full object-cover'
          />
          <div className='flex flex-col gap-2'>
            <p className='text-5xl font-bold'>{clubName}</p>
            <p className='text-neutral text-2xl font-medium'>{clubDetails.description}</p>
            <div className='flex items-center gap-2'>
              {twitterLink && (
                <Link
                  href={twitterLink}
                  target='_blank'
                  rel='noopener noreferrer'
                >
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
        <div className='bg-background p-lg border-primary flex w-72 flex-col items-center gap-2 rounded-md border-2'>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Members</p>
            <p className='text-xl font-semibold'>{clubDetails.member_count}</p>
          </div>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Floor Price</p>
            <Price
              price={clubDetails.floor_price_wei}
              currencyAddress={clubDetails.floor_price_currency as Address}
              iconSize='18px'
              fontSize='font-semibold text-xl'
            />
          </div>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Total Sales</p>
            <p className='text-xl font-semibold'>{clubDetails.total_sales_count}</p>
          </div>
          <div className='flex w-full items-center justify-between'>
            <p className='font-sedan-sc text-xl'>Total Sales Volume</p>
            <Price
              price={clubDetails.total_sales_volume_wei}
              currencyAddress={clubDetails.floor_price_currency as Address}
              iconSize='18px'
              fontSize='font-semibold text-xl'
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ClubDetails
