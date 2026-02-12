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
import PokemonHeader from 'public/clubs/pokemon/header.jpg'
import OneKForenamesAvatar from 'public/clubs/1kforenames/avatar.jpg'
import OneKForenamesHeader from 'public/clubs/1kforenames/header.jpg'
import OneKSurnamesAvatar from 'public/clubs/1ksurnames/avatar.jpg'
import OneKSurnamesHeader from 'public/clubs/1ksurnames/header.jpg'
import NineNinetyNineAvatar from 'public/clubs/999/avatar.jpg'
import NineNinetyNineHeader from 'public/clubs/999/header.jpeg'
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
import TopNounsAvatar from 'public/clubs/top_nouns/avatar.jpg'
import TopNounsHeader from 'public/clubs/top_nouns/header.jpeg'
import WikidataTopFantasyCharAvatar from 'public/clubs/wikidata_top_fantasy_char/avatar.jpg'
import WikidataTopFantasyCharHeader from 'public/clubs/wikidata_top_fantasy_char/header.jpeg'
import UnCapitalCitiesAvatar from 'public/clubs/un_capital_cities/avatar.jpg'
import UnCapitalCitiesHeader from 'public/clubs/un_capital_cities/header.jpeg'
import UnCountriesAvatar from 'public/clubs/un_countries/avatar.jpg'
import UnCountriesHeader from 'public/clubs/un_countries/header.jpg'

import ThreeLetterPalindromesAvatar from 'public/clubs/3_letter_palindromes/avatar.jpg'
import ThreeLetterPalindromesHeader from 'public/clubs/3_letter_palindromes/header.jpg'
import ThreeDigitPalindromesAvatar from 'public/clubs/3_digit_palindromes/avatar.jpg'
import ThreeDigitPalindromesHeader from 'public/clubs/3_digit_palindromes/header.jpg'
import FourDigitPalindromesAvatar from 'public/clubs/4_digit_palindromes/avatar.jpg'
import FourDigitPalindromesHeader from 'public/clubs/4_digit_palindromes/header.jpg'
import FiveDigitPalindromesAvatar from 'public/clubs/5_digit_palindromes/avatar.jpg'
import FiveDigitPalindromesHeader from 'public/clubs/5_digit_palindromes/header.jpg'
import SixDigitPalindromesAvatar from 'public/clubs/6_digit_palindromes/avatar.jpg'
import SixDigitPalindromesHeader from 'public/clubs/6_digit_palindromes/header.jpg'
import HundredKAvatar from 'public/clubs/100k_club/avatar.jpg'
import HundredKHeader from 'public/clubs/100k_club/header.jpg'
import DoubleEthmojiAvatar from 'public/clubs/double_ethmoji/avatar.jpg'
import DoubleEthmojiHeader from 'public/clubs/double_ethmoji/header.png'

import DoubleTripleDigitsAvatar from 'public/clubs/double_triple_digits/avatar.jpg'
import DoubleTripleDigitsHeader from 'public/clubs/double_triple_digits/header.jpg'
import Ethmoji10kAvatar from 'public/clubs/ethmoji_10k/avatar.jpg'
import Ethmoji10kHeader from 'public/clubs/ethmoji_10k/header.png'
import PrepunkDigitsAvatar from 'public/clubs/prepunk_digits/avatar.jpg'
import PrepunkDigitsHeader from 'public/clubs/prepunk_digits/header.jpeg'

import QuadEthmojiAvatar from 'public/clubs/quad_ethmoji/avatar.jpg'
import QuadEthmojiHeader from 'public/clubs/quad_ethmoji/header.png'
import QuintEthmojiAvatar from 'public/clubs/quint_ethmoji/avatar.jpg'
import QuintEthmojiHeader from 'public/clubs/quint_ethmoji/header.png'

import TopCryptoNamesAvatar from 'public/clubs/top_crypto_names/avatar.jpg'
import TopCryptoNamesHeader from 'public/clubs/top_crypto_names/header.jpg'
import TopCryptoTickersAvatar from 'public/clubs/top_crypto_tickers/avatar.jpg'
import TopCryptoTickersHeader from 'public/clubs/top_crypto_tickers/header.jpg'
import TopCitiesGlobalAvatar from 'public/clubs/top_cities_global/avatar.jpg'
import TopCitiesGlobalHeader from 'public/clubs/top_cities_global/header.png'
import TopCitiesUsaAvatar from 'public/clubs/top_cities_usa/avatar.jpg'
import TopCitiesUsaHeader from 'public/clubs/top_cities_usa/header.png'
import UsStatesAvatar from 'public/clubs/us_states/avatar.jpg'
import UsStatesHeader from 'public/clubs/us_states/header.jpg'

import CommonAnimalsAvatar from 'public/clubs/common_animals/avatar.jpg'
import CommonAnimalsHeader from 'public/clubs/common_animals/header.jpg'
import CommonEnglishAvatar from 'public/clubs/common_english/avatar.jpg'
import CommonEnglishHeader from 'public/clubs/common_english/header.jpg'
import CountryCodesAvatar from 'public/clubs/country_codes/avatar.jpg'
import CountryCodesHeader from 'public/clubs/country_codes/header.jpg'
import GamertagsAvatar from 'public/clubs/gamertags/avatar.jpg'
import GamertagsHeader from 'public/clubs/gamertags/header.jpeg'
import GamertagsDoubleAvatar from 'public/clubs/gamertags_double/avatar.jpg'
import GamertagsDoubleHeader from 'public/clubs/gamertags_double/header.jpeg'

import CryptoTermsAvatar from 'public/clubs/crypto_terms/avatar.jpg'
import CryptoTermsHeader from 'public/clubs/crypto_terms/header.jpg'
import SocialHandlesAvatar from 'public/clubs/social_handles/avatar.jpg'
import SocialHandlesHeader from 'public/clubs/social_handles/header.jpg'
import PokemonGen1Avatar from 'public/clubs/pokemon_gen1/avatar.jpg'
import PokemonGen1Header from 'public/clubs/pokemon_gen1/header.jpg'
import PokemonGen2Avatar from 'public/clubs/pokemon_gen2/avatar.jpg'
import PokemonGen2Header from 'public/clubs/pokemon_gen2/header.jpg'
import PokemonGen3Avatar from 'public/clubs/pokemon_gen3/avatar.jpg'
import PokemonGen3Header from 'public/clubs/pokemon_gen3/header.jpg'
import PokemonGen4Avatar from 'public/clubs/pokemon_gen4/avatar.jpg'
import PokemonGen4Header from 'public/clubs/pokemon_gen4/header.jpg'

import FamilynamesUsaAvatar from 'public/clubs/familynames_usa/avatar.jpg'
import FamilynamesUsaHeader from 'public/clubs/familynames_usa/header.jpg'
import FirstnamesUsaAvatar from 'public/clubs/firstnames_usa/avatar.jpg'
import FirstnamesUsaHeader from 'public/clubs/firstnames_usa/header.jpg'
import MythicalCreaturesAvatar from 'public/clubs/mythical_creatures/avatar.jpg'
import MythicalCreaturesHeader from 'public/clubs/mythical_creatures/header.png'
import PersonasAvatar from 'public/clubs/personas/avatar.png'
import PersonasHeader from 'public/clubs/personas/header.jpg'
import AiWordsAvatar from 'public/clubs/ai_words/avatar.jpeg'
import AiWordsHeader from 'public/clubs/ai_words/header.jpg'
import InstrumentsAvatar from 'public/clubs/instruments/avatar.png'
import InstrumentsHeader from 'public/clubs/instruments/header.jpg'
import CatholicismAvatar from 'public/clubs/catholicism/avatar.jpeg'
import CatholicismHeader from 'public/clubs/catholicism/header.jpg'
import CrayolaClassicAvatar from 'public/clubs/crayola_classic/avatar.jpg'
import CrayolaClassicHeader from 'public/clubs/crayola_classic/header.jpg'
import HolidaysAvatar from 'public/clubs/holidays/avatar.jpg'
import HolidaysHeader from 'public/clubs/holidays/header.jpg'
import ParanormalAvatar from 'public/clubs/paranormal/avatar.jpg'
import ParanormalHeader from 'public/clubs/paranormal/header.jpg'

import { getCategoryDetails } from '@/utils/getCategoryDetails'

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
  top_nouns: {
    avatar: TopNounsAvatar,
    header: TopNounsHeader,
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
  top_crypto_names: {
    avatar: TopCryptoNamesAvatar,
    header: TopCryptoNamesHeader,
  },
  top_crypto_tickers: {
    avatar: TopCryptoTickersAvatar,
    header: TopCryptoTickersHeader,
  },
  top_cities_global: {
    avatar: TopCitiesGlobalAvatar,
    header: TopCitiesGlobalHeader,
  },
  top_cities_usa: {
    avatar: TopCitiesUsaAvatar,
    header: TopCitiesUsaHeader,
  },
  us_states: {
    avatar: UsStatesAvatar,
    header: UsStatesHeader,
  },
  common_animals: {
    avatar: CommonAnimalsAvatar,
    header: CommonAnimalsHeader,
  },
  common_english: {
    avatar: CommonEnglishAvatar,
    header: CommonEnglishHeader,
  },
  country_codes: {
    avatar: CountryCodesAvatar,
    header: CountryCodesHeader,
  },
  gamertags: {
    avatar: GamertagsAvatar,
    header: GamertagsHeader,
  },
  gamertags_double: {
    avatar: GamertagsDoubleAvatar,
    header: GamertagsDoubleHeader,
  },
  crypto_terms: {
    avatar: CryptoTermsAvatar,
    header: CryptoTermsHeader,
  },
  social_handles: {
    avatar: SocialHandlesAvatar,
    header: SocialHandlesHeader,
  },
  pokemon_gen1: {
    avatar: PokemonGen1Avatar,
    header: PokemonGen1Header,
  },
  pokemon_gen2: {
    avatar: PokemonGen2Avatar,
    header: PokemonGen2Header,
  },
  pokemon_gen3: {
    avatar: PokemonGen3Avatar,
    header: PokemonGen3Header,
  },
  pokemon_gen4: {
    avatar: PokemonGen4Avatar,
    header: PokemonGen4Header,
  },
  familynames_usa: {
    avatar: FamilynamesUsaAvatar,
    header: FamilynamesUsaHeader,
  },
  firstnames_usa: {
    avatar: FirstnamesUsaAvatar,
    header: FirstnamesUsaHeader,
  },
  mythical_creatures: {
    avatar: MythicalCreaturesAvatar,
    header: MythicalCreaturesHeader,
  },
  personas: {
    avatar: PersonasAvatar,
    header: PersonasHeader,
  },
  ai_words: {
    avatar: AiWordsAvatar,
    header: AiWordsHeader,
  },
  instruments: {
    avatar: InstrumentsAvatar,
    header: InstrumentsHeader,
  },
  catholicism: {
    avatar: CatholicismAvatar,
    header: CatholicismHeader,
  },
  crayola_classic: {
    avatar: CrayolaClassicAvatar,
    header: CrayolaClassicHeader,
  },
  holidays: {
    avatar: HolidaysAvatar,
    header: HolidaysHeader,
  },
  paranormal: {
    avatar: ParanormalAvatar,
    header: ParanormalHeader,
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
  const {
    name: categoryName,
    avatar: categoryAvatar,
    header: categoryHeader,
  } = getCategoryDetails(categoryDetails.name)
  const twitterLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS]?.twitter || null
  const githubLink = CATEGORY_SOCIAL_LINKS[categoryDetails.name as keyof typeof CATEGORY_SOCIAL_LINKS]?.github || null

  return (
    <div className='relative w-full items-center justify-center md:px-4'>
      <Image
        src={categoryHeader}
        alt={`${categoryName} header`}
        width={1000}
        height={1000}
        className='bg-foreground absolute top-0 left-0 hidden h-full w-full object-cover opacity-20 md:block'
      />
      <div className='relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-between md:flex-row md:gap-8 md:py-4'>
        <div className='relative z-10 flex w-full items-center py-6 md:w-fit md:py-0'>
          <Image
            src={categoryHeader}
            alt={`${categoryName} header`}
            width={1000}
            height={1000}
            className='bg-foreground absolute top-0 left-0 block h-full w-full object-cover opacity-20 md:hidden'
          />
          <div className='relative z-20 flex items-start gap-4 px-4 md:px-0'>
            <Image
              src={categoryAvatar}
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
