import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { CategoryType } from '@/types/domains'
import PrepunksAvatar from 'public/clubs/prepunks/avatar.jpg'
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
import GithubIcon from 'public/logos/github.svg'
import { localizeNumber } from '@/utils/localizeNumber'
import SingleEthmojiAvatar from 'public/clubs/single_ethmoji/avatar.jpg'
import SingleEthmojiHeader from 'public/clubs/single_ethmoji/header.jpeg'
import TripleEthmojiAvatar from 'public/clubs/triple_ethmoji/avatar.jpg'
import TripleEthmojiHeader from 'public/clubs/triple_ethmoji/header.jpeg'
import Ethmoji99Avatar from 'public/clubs/ethmoji_99/avatar.jpg'
import Ethmoji99Header from 'public/clubs/ethmoji_99/header.jpeg'
import Ethmoji999Avatar from 'public/clubs/ethmoji_999/avatar.jpg'
import Ethmoji999Header from 'public/clubs/ethmoji_999/header.jpeg'
import BaseSingleEthmojiAvatar from 'public/clubs/base_single_ethmoji/avatar.jpg'
import BaseSingleEthmojiHeader from 'public/clubs/base_single_ethmoji/header.jpeg'
import Prepunk100Avatar from 'public/clubs/prepunk_100/avatar.jpg'
import Prepunk100Header from 'public/clubs/prepunk_100/header.jpeg'
import Prepunk1kAvatar from 'public/clubs/prepunk_1k/avatar.jpg'
import Prepunk1kHeader from 'public/clubs/prepunk_1k/header.jpeg'
import Prepunk10kAvatar from 'public/clubs/prepunk_10k/avatar.jpg'
import Prepunk10kHeader from 'public/clubs/prepunk_10k/header.jpeg'
import BIP39Avatar from 'public/clubs/bip_39/avatar.jpg'
import BIP39Header from 'public/clubs/bip_39/header.jpeg'
import PeriodicTableAvatar from 'public/clubs/periodic_table/avatar.jpg'
import PeriodicTableHeader from 'public/clubs/periodic_table/header.jpeg'
import EnglishAdjectivesAvatar from 'public/clubs/english_adjectives/avatar.jpg'
import EnglishAdjectivesHeader from 'public/clubs/english_adjectives/header.jpeg'
import WikidataTopNounsAvatar from 'public/clubs/wikidata_top_nouns/avatar.jpg'
import WikidataTopNounsHeader from 'public/clubs/wikidata_top_nouns/header.jpeg'
import WikidataTopFantasyCharAvatar from 'public/clubs/wikidata_top_fantasy_char/avatar.jpg'
import WikidataTopFantasyCharHeader from 'public/clubs/wikidata_top_fantasy_char/header.jpeg'
import UnCapitalCitiesAvatar from 'public/clubs/un_capital_cities/avatar.jpg'
import UnCapitalCitiesHeader from 'public/clubs/un_capital_cities/header.jpeg'
import UnCountriesAvatar from 'public/clubs/un_countries/avatar.jpg'
import UnCountriesHeader from 'public/clubs/un_countries/header.jpeg'

import ThreeLetterPalindromesAvatar from 'public/clubs/3_letter_palindromes/avatar.png'
import ThreeLetterPalindromesHeader from 'public/clubs/3_letter_palindromes/header.jpg'
import ThreeDigitPalindromesAvatar from 'public/clubs/3_digit_palindromes/avatar.png'
import ThreeDigitPalindromesHeader from 'public/clubs/3_digit_palindromes/header.jpg'
import FourDigitPalindromesAvatar from 'public/clubs/4_digit_palindromes/avatar.png'
import FourDigitPalindromesHeader from 'public/clubs/4_digit_palindromes/header.jpg'
import FiveDigitPalindromesAvatar from 'public/clubs/5_digit_palindromes/avatar.png'
import FiveDigitPalindromesHeader from 'public/clubs/5_digit_palindromes/header.jpg'
import SixDigitPalindromesAvatar from 'public/clubs/6_digit_palindromes/avatar.png'
import SixDigitPalindromesHeader from 'public/clubs/6_digit_palindromes/header.jpg'
import HundredKAvatar from 'public/clubs/100k_club/avatar.png'
import HundredKHeader from 'public/clubs/100k_club/header.jpg'
import DoubleEthmojiAvatar from 'public/clubs/double_ethmoji/avatar.png'
import DoubleEthmojiHeader from 'public/clubs/double_ethmoji/header.png'

import DoubleTripleDigitsAvatar from 'public/clubs/double_triple_digits/avatar.png'
import DoubleTripleDigitsHeader from 'public/clubs/double_triple_digits/header.jpg'
import Ethmoji10kAvatar from 'public/clubs/ethmoji_10k/avatar.png'
import Ethmoji10kHeader from 'public/clubs/ethmoji_10k/header.png'
import PrepunkDigitsAvatar from 'public/clubs/prepunk_digits/avatar.jpeg'
import PrepunkDigitsHeader from 'public/clubs/prepunk_digits/header.jpeg'

import QuadEthmojiAvatar from 'public/clubs/quad_ethmoji/avatar.png'
import QuadEthmojiHeader from 'public/clubs/quad_ethmoji/header.png'
import QuintEthmojiAvatar from 'public/clubs/quint_ethmoji/avatar.png'
import QuintEthmojiHeader from 'public/clubs/quint_ethmoji/header.png'

import { DEFAULT_FALLBACK_AVATAR, DEFAULT_FALLBACK_HEADER } from 'ethereum-identity-kit'

export const CATEGORY_IMAGES = {
  prepunk_100: {
    avatar: Prepunk100Avatar,
    header: Prepunk100Header,
  },
  prepunk_1k: {
    avatar: Prepunk1kAvatar,
    header: Prepunk1kHeader,
  },
  prepunk_10k: {
    avatar: Prepunk10kAvatar,
    header: Prepunk10kHeader,
  },
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
  single_ethmoji: {
    avatar: SingleEthmojiAvatar,
    header: SingleEthmojiHeader,
  },
  triple_ethmoji: {
    avatar: TripleEthmojiAvatar,
    header: TripleEthmojiHeader,
  },
  ethmoji_99: {
    avatar: Ethmoji99Avatar,
    header: Ethmoji99Header,
  },
  ethmoji_999: {
    avatar: Ethmoji999Avatar,
    header: Ethmoji999Header,
  },
  base_single_ethmoji: {
    avatar: BaseSingleEthmojiAvatar,
    header: BaseSingleEthmojiHeader,
  },
  bip_39: {
    avatar: BIP39Avatar,
    header: BIP39Header,
  },
  periodic_table: {
    avatar: PeriodicTableAvatar,
    header: PeriodicTableHeader,
  },
  english_adjectives: {
    avatar: EnglishAdjectivesAvatar,
    header: EnglishAdjectivesHeader,
  },
  wikidata_top_nouns: {
    avatar: WikidataTopNounsAvatar,
    header: WikidataTopNounsHeader,
  },
  wikidata_top_fantasy_char: {
    avatar: WikidataTopFantasyCharAvatar,
    header: WikidataTopFantasyCharHeader,
  },
  un_capital_cities: {
    avatar: UnCapitalCitiesAvatar,
    header: UnCapitalCitiesHeader,
  },
  un_countries: {
    avatar: UnCountriesAvatar,
    header: UnCountriesHeader,
  },
  '3_letter_palindromes': {
    avatar: ThreeLetterPalindromesAvatar,
    header: ThreeLetterPalindromesHeader,
  },
  '3_digit_palindromes': {
    avatar: ThreeDigitPalindromesAvatar,
    header: ThreeDigitPalindromesHeader,
  },
  '4_digit_palindromes': {
    avatar: FourDigitPalindromesAvatar,
    header: FourDigitPalindromesHeader,
  },
  '5_digit_palindromes': {
    avatar: FiveDigitPalindromesAvatar,
    header: FiveDigitPalindromesHeader,
  },
  '6_digit_palindromes': {
    avatar: SixDigitPalindromesAvatar,
    header: SixDigitPalindromesHeader,
  },
  '100k_club': {
    avatar: HundredKAvatar,
    header: HundredKHeader,
  },
  double_ethmoji: {
    avatar: DoubleEthmojiAvatar,
    header: DoubleEthmojiHeader,
  },
  double_triple_digits: {
    avatar: DoubleTripleDigitsAvatar,
    header: DoubleTripleDigitsHeader,
  },
  ethmoji_10k: {
    avatar: Ethmoji10kAvatar,
    header: Ethmoji10kHeader,
  },
  prepunk_digits: {
    avatar: PrepunkDigitsAvatar,
    header: PrepunkDigitsHeader,
  },
  quad_ethmoji: {
    avatar: QuadEthmojiAvatar,
    header: QuadEthmojiHeader,
  },
  quint_ethmoji: {
    avatar: QuintEthmojiAvatar,
    header: QuintEthmojiHeader,
  },
}

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
}

interface Props {
  categoryDetails: CategoryType
}

const CategoryDetails = ({ categoryDetails }: Props) => {
  const categoryName = CATEGORY_LABELS[categoryDetails.name as keyof typeof CATEGORY_LABELS] || categoryDetails.name
  const categoryImage = CATEGORY_IMAGES[categoryDetails.name as keyof typeof CATEGORY_IMAGES] || {
    avatar: DEFAULT_FALLBACK_AVATAR,
    header: DEFAULT_FALLBACK_HEADER,
  }
  const twitterLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS]?.twitter || null
  const githubLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS]?.github || null

  return (
    <div className='relative w-full items-center justify-center md:px-4'>
      <Image
        src={categoryImage.header}
        alt={`${categoryName} header`}
        width={1000}
        height={1000}
        className='bg-foreground absolute top-0 left-0 hidden h-full w-full object-cover opacity-20 md:block'
      />
      <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-between md:flex-row md:gap-8 md:py-4'>
        <div className='relative z-10 flex w-full items-center py-6 md:w-fit md:py-0'>
          <Image
            src={categoryImage.header}
            alt={`${categoryName} header`}
            width={1000}
            height={1000}
            className='bg-foreground absolute top-0 left-0 block h-full w-full object-cover opacity-20 md:hidden'
          />
          <div className='relative z-20 flex items-start gap-4 px-4 md:px-0'>
            <Image
              src={categoryImage.avatar}
              alt={`${categoryName} avatar`}
              width={100}
              height={100}
              className='h-16 w-16 rounded-full object-cover md:h-24 md:w-24'
            />
            <div className='flex flex-col gap-2'>
              <div className='flex flex-row items-center gap-2'>
                <p className='text-3xl font-bold md:text-4xl lg:text-5xl'>{categoryName}</p>
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
                {githubLink && (
                  <Link href={githubLink} target='_blank' rel='noopener noreferrer'>
                    <Image
                      src={GithubIcon}
                      alt='Github'
                      width={28}
                      height={28}
                      className='border-tertiary rounded-full border bg-black p-px transition-opacity hover:opacity-70'
                    />
                  </Link>
                )}
              </div>
              <p className='text-neutral text-xl font-medium md:text-2xl'>{categoryDetails.description}</p>
            </div>
          </div>
        </div>
        <div className='bg-background p-lg border-tertiary relative z-20 flex w-full flex-col items-center gap-2 border-t-2 md:w-72 md:rounded-md md:border-2'>
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
