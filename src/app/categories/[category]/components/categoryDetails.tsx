import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import TwitterIcon from 'public/logos/x.svg'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { localizeNumber } from '@/utils/localizeNumber'
// import GithubIcon from 'public/logos/github.svg'

export const CATEGORY_SOCIAL_LINKS: Record<string, { twitter?: string; github?: string }> = {
  prepunks: {
    twitter: 'https://x.com/PrePunkOfficial',
  },
  prepunk_100: {
    twitter: 'https://x.com/PrePunkOfficial',
  },
  prepunk_1k: {
    twitter: 'https://x.com/PrePunkOfficial',
  },
  prepunk_10k: {
    twitter: 'https://x.com/PrePunkOfficial',
  },
  '10k': {
    twitter: 'https://x.com/10kClubOfficial',
  },
  pokemon: {
    twitter: 'https://x.com/PokemonENS',
  },
  '999': {
    twitter: 'https://x.com/ens999club',
  },
  base_single_ethmoji: {
    twitter: 'https://x.com/EthmojiClub',
  },
  single_ethmoji: {
    twitter: 'https://x.com/EthmojiClub',
  },
  triple_ethmoji: {
    twitter: 'https://x.com/EthmojiClub',
  },
  ethmoji_999: {
    twitter: 'https://x.com/Ethmoji999',
  },
  ethmoji_99: {
    twitter: 'https://x.com/Ethmoji99',
  },
  wikidata_top_fantasy_char: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main/wikidata_top_fantasy_char',
  },
  prepunk_digits: {
    twitter: 'https://x.com/PrePunkOfficial',
  },
  ethmoji_10k: {
    twitter: 'https://x.com/EthmojiClub',
  },
  quad_ethmoji: {
    twitter: 'https://x.com/EthmojiClub',
  },
  quint_ethmoji: {
    twitter: 'https://x.com/EthmojiClub',
  },
  double_ethmoji: {
    twitter: 'https://x.com/EthmojiClub',
  },
  top_crypto_names: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  top_crypto_tickers: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  top_cities_global: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  top_cities_usa: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  us_states: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  common_animals: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  common_english: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  gamertags: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  gamertags_double: {
    github: 'https://github.com/grailsmarket/ens-categories/tree/main',
  },
  pokemon_gen1: {
    twitter: 'https://x.com/PokemonENS',
  },
  pokemon_gen2: {
    twitter: 'https://x.com/PokemonENS',
  },
  pokemon_gen3: {
    twitter: 'https://x.com/PokemonENS',
  },
  pokemon_gen4: {
    twitter: 'https://x.com/PokemonENS',
  },
}

interface Props {
  categoryDetails: CategoryType
}

const CategoryDetails = ({ categoryDetails }: Props) => {
  const { avatar: categoryAvatar, header: categoryHeader } = getCategoryDetails(categoryDetails.name)
  const twitterLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS]?.twitter || null
  // const githubLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS]?.github || null

  return (
    <div className='relative w-full items-center justify-center md:px-4'>
      <Image
        src={categoryHeader}
        alt={`${categoryDetails.display_name} header`}
        width={1000}
        height={1000}
        className='bg-foreground absolute top-0 left-0 hidden h-full w-full object-cover opacity-20 md:block'
      />
      <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-between md:flex-row md:gap-8 md:py-4'>
        <div className='relative z-10 flex w-full items-center py-6 md:w-fit md:py-0'>
          <Image
            src={categoryHeader}
            alt={`${categoryDetails.display_name} header`}
            width={1000}
            height={1000}
            className='bg-foreground absolute top-0 left-0 block h-full w-full object-cover opacity-20 md:hidden'
          />
          <div className='relative z-20 flex items-start gap-4 px-4 md:px-0'>
            <Image
              src={categoryAvatar}
              alt={`${categoryDetails.display_name} avatar`}
              width={100}
              height={100}
              className='h-16 w-16 rounded-full object-cover md:h-24 md:w-24'
            />
            <div className='flex flex-col gap-2'>
              <div className='flex flex-row items-center gap-2'>
                <p className='text-3xl font-bold md:text-4xl lg:text-5xl'>{categoryDetails.display_name}</p>
                {twitterLink && (
                  <Link href={twitterLink} target='_blank' rel='noopener noreferrer'>
                    <Image
                      src={TwitterIcon}
                      alt='Twitter'
                      width={28}
                      height={28}
                      className='border-tertiary rounded-full border bg-black p-px transition-opacity hover:opacity-70'
                    />
                  </Link>
                )}
                {/* {githubLink && (
                  <Link href={githubLink} target='_blank' rel='noopener noreferrer'>
                    <Image
                      src={GithubIcon}
                      alt='Github'
                      width={28}
                      height={28}
                      className='border-tertiary rounded-full border bg-black p-px transition-opacity hover:opacity-70'
                    />
                  </Link>
                )} */}
              </div>
              <p className='text-neutral text-xl font-medium md:text-2xl'>{categoryDetails.description}</p>
            </div>
          </div>
        </div>
        <div className='bg-background px-md py-lg sm:p-xl border-tertiary relative z-20 flex flex-col items-center gap-2 border-t-2 md:rounded-md md:border-2'>
          {/* <div className='flex w-full items-center justify-between'>
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
          </div> */}
          <div className='xs:grid-cols-4 grid grid-cols-3 gap-4 gap-y-4 sm:gap-y-6'>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <p className='text-lg font-semibold'>{localizeNumber(categoryDetails.member_count ?? 0)}</p>
              <p className='text-neutral text-lg'>Names</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <Price
                price={categoryDetails.sales_volume_wei_1mo}
                currencyAddress={categoryDetails.floor_price_currency as Address}
                iconSize='18px'
                fontSize='text-lg font-semibold'
              />
              <p className='text-neutral text-lg font-medium'>
                Volume&nbsp;
                <span className='text-lg'>(1mo)</span>
              </p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <Price
                price={categoryDetails.floor_price_wei}
                currencyAddress={categoryDetails.floor_price_currency as Address}
                iconSize='18px'
                fontSize='text-lg font-semibold'
              />
              <p className='text-neutral text-lg font-medium'>Floor</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <p className='text-lg font-semibold'>{localizeNumber(categoryDetails.sales_count_1mo)}</p>
              <p className='text-neutral text-lg font-medium'>
                Sales&nbsp;
                <span className='text-lg'>(1mo)</span>
              </p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.registered_count ?? 0)}</p>
                <p className='text-md text-neutral pt-px font-medium'>
                  ({(categoryDetails.registered_percent ?? 0).toFixed(1)}%)
                </p>
              </div>
              <p className='text-neutral text-lg'>Registered</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.grace_count ?? 0)}</p>
                <p className='text-md text-neutral pt-px font-medium'>
                  ({(categoryDetails.grace_percent ?? 0).toFixed(1)}%)
                </p>
              </div>
              <p className='text-grace text-lg font-medium'>Grace</p>
            </div>
            {/* <div className='z-10 flex h-fit flex-col items-start border-l-2 border-neutral pl-2'>
          <p className='text-lg font-semibold'>
          <span className='mr-1 text-lg font-medium'>
          ({(categoryDetails.registered_percent + categoryDetails.grace_percent).toFixed(1)}%)
          </span>
          {localizeNumber(categoryDetails.registered_count + categoryDetails.grace_count)}
          </p>
          <p className='font-sedan-sc text-xl md:text-2xl'>
            Reg+<span className='text-grace'>Grace</span>
          </p>
        </div> */}
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.premium_count ?? 0)}</p>
                <p className='text-md text-neutral pt-px font-medium'>
                  (
                  {categoryDetails.member_count && categoryDetails.member_count > 0
                    ? (((categoryDetails.premium_count ?? 0) / categoryDetails.member_count) * 100).toLocaleString(
                      navigator.language,
                      {
                        maximumFractionDigits: 1,
                      }
                    )
                    : 0}
                  %)
                </p>
              </div>
              <p className='text-premium text-lg font-medium'>Premium</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.available_count ?? 0)}</p>
                <p className='text-md text-neutral pt-px font-medium'>
                  (
                  {categoryDetails.member_count && categoryDetails.member_count > 0
                    ? (((categoryDetails.available_count ?? 0) / categoryDetails.member_count) * 100).toLocaleString(
                      navigator.language,
                      {
                        maximumFractionDigits: 1,
                      }
                    )
                    : 0}
                  %)
                </p>
              </div>
              <p className='text-available text-lg font-medium'>Available</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.listings_count ?? 0)}</p>
                <p className='text-md text-neutral pt-px font-medium'>
                  ({(categoryDetails.listings_percent ?? 0).toFixed(1)}%)
                </p>
              </div>
              <p className='text-neutral text-lg font-medium'>Listings</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.total_reg_count ?? 0)}</p>
              </div>
              <p className='text-neutral text-lg font-medium'>Registrations</p>
            </div>
            <div className='border-neutral z-10 flex h-fit flex-col items-start border-l-2 pl-2'>
              <div className='flex items-center gap-[3px] text-lg font-semibold'>
                <p>{localizeNumber(categoryDetails.holders_count ?? 0)}</p>
                <p className='text-md text-neutral pt-px font-medium'>
                  (
                  {categoryDetails.holders_count && categoryDetails.holders_count > 0
                    ? (categoryDetails.member_count / categoryDetails.holders_count).toLocaleString(
                      navigator.language,
                      {
                        maximumFractionDigits: 1,
                      }
                    )
                    : 0}
                  )
                </p>
              </div>
              <p className='text-neutral text-lg font-medium'>Holders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryDetails
