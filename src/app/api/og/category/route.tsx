import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { fetchCategories } from '@/api/domains/fetchCategories'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

export const CATEGORY_IMAGES = {
  prepunks: {
    avatar: 'https://grails.app/clubs/prepunks/avatar.jpg',
    header: 'https://grails.app/clubs/prepunks/header.jpeg',
  },
  '10k': {
    avatar: 'https://grails.app/clubs/10k/avatar.jpg',
    header: 'https://grails.app/clubs/10k/header.jpeg',
  },
  pokemon: {
    avatar: 'https://grails.app/clubs/pokemon/avatar.jpg',
    header: 'https://grails.app/clubs/pokemon/header.jpg',
  },
  '1kforenames': {
    avatar: 'https://grails.app/clubs/1kforenames/avatar.jpg',
    header: 'https://grails.app/clubs/1kforenames/header.jpg',
  },
  '1ksurnames': {
    avatar: 'https://grails.app/clubs/1ksurnames/avatar.jpg',
    header: 'https://grails.app/clubs/1ksurnames/header.jpg',
  },
  '999': {
    avatar: 'https://grails.app/clubs/999/avatar.jpg',
    header: 'https://grails.app/clubs/999/header.jpeg',
  },
  ethmoji_99: {
    avatar: 'https://grails.app/clubs/ethmoji_99/avatar.jpg',
    header: 'https://grails.app/clubs/ethmoji_99/header.jpeg',
  },
  ethmoji_999: {
    avatar: 'https://grails.app/clubs/ethmoji_999/avatar.jpg',
    header: 'https://grails.app/clubs/ethmoji_999/header.jpeg',
  },
  base_single_ethmoji: {
    avatar: 'https://grails.app/clubs/base_single_ethmoji/avatar.jpg',
    header: 'https://grails.app/clubs/base_single_ethmoji/header.jpeg',
  },
  single_ethmoji: {
    avatar: 'https://grails.app/clubs/single_ethmoji/avatar.jpg',
    header: 'https://grails.app/clubs/single_ethmoji/header.jpeg',
  },
  triple_ethmoji: {
    avatar: 'https://grails.app/clubs/triple_ethmoji/avatar.jpg',
    header: 'https://grails.app/clubs/triple_ethmoji/header.jpeg',
  },
  prepunk_100: {
    avatar: 'https://grails.app/clubs/prepunk_100/avatar.jpg',
    header: 'https://grails.app/clubs/prepunk_100/header.jpeg',
  },
  prepunk_1k: {
    avatar: 'https://grails.app/clubs/prepunk_1k/avatar.jpg',
    header: 'https://grails.app/clubs/prepunk_1k/header.jpeg',
  },
  prepunk_10k: {
    avatar: 'https://grails.app/clubs/prepunk_10k/avatar.jpg',
    header: 'https://grails.app/clubs/prepunk_10k/header.jpeg',
  },
  bip_39: {
    avatar: 'https://grails.app/clubs/bip_39/avatar.jpg',
    header: 'https://grails.app/clubs/bip_39/header.jpeg',
  },
  periodic_table: {
    avatar: 'https://grails.app/clubs/periodic_table/avatar.jpg',
    header: 'https://grails.app/clubs/periodic_table/header.jpeg',
  },
  english_adjectives: {
    avatar: 'https://grails.app/clubs/english_adjectives/avatar.jpg',
    header: 'https://grails.app/clubs/english_adjectives/header.jpeg',
  },
  top_nouns: {
    avatar: 'https://grails.app/clubs/top_nouns/avatar.jpg',
    header: 'https://grails.app/clubs/top_nouns/header.jpeg',
  },
  wikidata_top_fantasy_char: {
    avatar: 'https://grails.app/clubs/wikidata_top_fantasy_char/avatar.jpg',
    header: 'https://grails.app/clubs/wikidata_top_fantasy_char/header.jpeg',
  },
  un_capital_cities: {
    avatar: 'https://grails.app/clubs/un_capital_cities/avatar.jpg',
    header: 'https://grails.app/clubs/un_capital_cities/header.jpeg',
  },
  un_countries: {
    avatar: 'https://grails.app/clubs/un_countries/avatar.jpg',
    header: 'https://grails.app/clubs/un_countries/header.jpeg',
  },
  '3_letter_palindromes': {
    avatar: 'https://grails.app/clubs/3_letter_palindromes/avatar.jpg',
    header: 'https://grails.app/clubs/3_letter_palindromes/header.jpeg',
  },
  '3_digit_palindromes': {
    avatar: 'https://grails.app/clubs/3_digit_palindromes/avatar.jpg',
    header: 'https://grails.app/clubs/3_digit_palindromes/header.jpeg',
  },
  '4_digit_palindromes': {
    avatar: 'https://grails.app/clubs/4_digit_palindromes/avatar.jpg',
    header: 'https://grails.app/clubs/4_digit_palindromes/header.jpeg',
  },
  '5_digit_palindromes': {
    avatar: 'https://grails.app/clubs/5_digit_palindromes/avatar.jpg',
    header: 'https://grails.app/clubs/5_digit_palindromes/header.jpeg',
  },
  '6_digit_palindromes': {
    avatar: 'https://grails.app/clubs/6_digit_palindromes/avatar.jpg',
    header: 'https://grails.app/clubs/6_digit_palindromes/header.jpeg',
  },
  '100k_club': {
    avatar: 'https://grails.app/clubs/100k_club/avatar.jpg',
    header: 'https://grails.app/clubs/100k_club/header.jpeg',
  },
  double_ethmoji: {
    avatar: 'https://grails.app/clubs/double_ethmoji/avatar.jpg',
    header: 'https://grails.app/clubs/double_ethmoji/header.jpeg',
  },
  double_triple_digits: {
    avatar: 'https://grails.app/clubs/double_triple_digits/avatar.jpg',
    header: 'https://grails.app/clubs/double_triple_digits/header.jpeg',
  },
  ethmoji_10k: {
    avatar: 'https://grails.app/clubs/ethmoji_10k/avatar.jpg',
    header: 'https://grails.app/clubs/ethmoji_10k/header.jpeg',
  },
  prepunk_digits: {
    avatar: 'https://grails.app/clubs/prepunk_digits/avatar.jpg',
    header: 'https://grails.app/clubs/prepunk_digits/header.jpeg',
  },
  quad_ethmoji: {
    avatar: 'https://grails.app/clubs/quad_ethmoji/avatar.jpg',
    header: 'https://grails.app/clubs/quad_ethmoji/header.jpeg',
  },
  quint_ethmoji: {
    avatar: 'https://grails.app/clubs/quint_ethmoji/avatar.jpg',
    header: 'https://grails.app/clubs/quint_ethmoji/header.jpeg',
  },
  top_crypto_names: {
    avatar: 'https://grails.app/clubs/top_crypto_names/avatar.jpg',
    header: 'https://grails.app/clubs/top_crypto_names/header.jpg',
  },
  top_crypto_tickers: {
    avatar: 'https://grails.app/clubs/top_crypto_tickers/avatar.jpg',
    header: 'https://grails.app/clubs/top_crypto_tickers/header.jpg',
  },
  top_cities_global: {
    avatar: 'https://grails.app/clubs/top_cities_global/avatar.jpg',
    header: 'https://grails.app/clubs/top_cities_global/header.png',
  },
  top_cities_usa: {
    avatar: 'https://grails.app/clubs/top_cities_usa/avatar.jpg',
    header: 'https://grails.app/clubs/top_cities_usa/header.png',
  },
  us_states: {
    avatar: 'https://grails.app/clubs/us_states/avatar.jpg',
    header: 'https://grails.app/clubs/us_states/header.jpg',
  },
  common_animals: {
    avatar: 'https://grails.app/clubs/common_animals/avatar.jpg',
    header: 'https://grails.app/clubs/common_animals/header.jpg',
  },
  common_english: {
    avatar: 'https://grails.app/clubs/common_english/avatar.jpg',
    header: 'https://grails.app/clubs/common_english/header.jpg',
  },
  country_codes: {
    avatar: 'https://grails.app/clubs/country_codes/avatar.jpg',
    header: 'https://grails.app/clubs/country_codes/header.jpg',
  },
  gamertags: {
    avatar: 'https://grails.app/clubs/gamertags/avatar.jpg',
    header: 'https://grails.app/clubs/gamertags/header.jpeg',
  },
  gamertags_double: {
    avatar: 'https://grails.app/clubs/gamertags_double/avatar.jpg',
    header: 'https://grails.app/clubs/gamertags_double/header.jpeg',
  },
  crypto_terms: {
    avatar: 'https://grails.app/clubs/crypto_terms/avatar.jpg',
    header: 'https://grails.app/clubs/crypto_terms/header.jpg',
  },
  social_handles: {
    avatar: 'https://grails.app/clubs/social_handles/avatar.jpg',
    header: 'https://grails.app/clubs/social_handles/header.jpg',
  },
  pokemon_gen1: {
    avatar: 'https://grails.app/clubs/pokemon_gen1/avatar.jpg',
    header: 'https://grails.app/clubs/pokemon_gen1/header.jpg',
  },
  pokemon_gen2: {
    avatar: 'https://grails.app/clubs/pokemon_gen2/avatar.jpg',
    header: 'https://grails.app/clubs/pokemon_gen2/header.jpg',
  },
  pokemon_gen3: {
    avatar: 'https://grails.app/clubs/pokemon_gen3/avatar.jpg',
    header: 'https://grails.app/clubs/pokemon_gen3/header.jpg',
  },
  pokemon_gen4: {
    avatar: 'https://grails.app/clubs/pokemon_gen4/avatar.jpg',
    header: 'https://grails.app/clubs/pokemon_gen4/header.jpg',
  },
  familynames_usa: {
    avatar: 'https://grails.app/clubs/familynames_usa/avatar.jpg',
    header: 'https://grails.app/clubs/familynames_usa/header.png',
  },
  firstnames_usa: {
    avatar: 'https://grails.app/clubs/firstnames_usa/avatar.jpg',
    header: 'https://grails.app/clubs/firstnames_usa/header.png',
  },
  mythical_creatures: {
    avatar: 'https://grails.app/clubs/mythical_creatures/avatar.jpg',
    header: 'https://grails.app/clubs/mythical_creatures/header.png',
  },
  personas: {
    avatar: 'https://grails.app/clubs/personas/avatar.png',
    header: 'https://grails.app/clubs/personas/header.jpg',
  },
}

export async function GET(req: NextRequest) {
  const category = req.url.split('category=')[1] || ''

  const getResponse = async () => {
    try {
      const response = await fetchCategories()
      const categoryData = response.find((c) => c.name === category)
      return categoryData
    } catch (error) {
      console.error(error)
      return null
    }
  }

  const categoryData = await getResponse()

  const categoryImage = CATEGORY_IMAGES[categoryData?.name as keyof typeof CATEGORY_IMAGES]
  const categoryName = CATEGORY_LABELS[categoryData?.name as keyof typeof CATEGORY_LABELS]
  const categoryDescription = categoryData?.description
  const categoryImageUrl = categoryImage.header
  const categoryAvatarUrl = categoryImage.avatar
  console.log(categoryImageUrl, categoryAvatarUrl)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          gap: 58,
          color: '#f4f4f4',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#222222',
          textAlign: 'center',
          fontWeight: 700,
          fontFamily: 'Inter',
        }}
      >
        <img
          alt='header'
          width='800'
          height='418'
          src={categoryImageUrl}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: 4,
            margin: 0,
            opacity: 0.2,
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <div
          style={{
            display: 'flex',
            width: 'auto',
            position: 'relative',
            flexDirection: 'row',
            alignItems: 'flex-start',
            borderRadius: 4,
            gap: 16,
            maxWidth: 700,
            margin: '0 auto',
            boxShadow: '2px 2px 7px 0px rgba(0, 0, 0, 0.1)',
          }}
        >
          <img
            alt='avatar'
            width='120'
            height='120'
            src={categoryAvatarUrl}
            style={{
              borderRadius: 60,
              marginTop: 12,
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <p
              style={{
                whiteSpace: 'nowrap',
                fontSize: 64,
                fontWeight: 700,
                margin: 0,
                padding: 0,
                textShadow: '1px 0 1px #ffffff',
                paddingBottom: 8,
              }}
            >
              {categoryName}
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 400,
                margin: 0,
                padding: 0,
                maxWidth: 540,
                textAlign: 'left',
                color: '#cccccc',
                textShadow: '1px 0 1px #cccccc',
              }}
            >
              {categoryDescription}
            </p>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <img alt='avatar' width='190' height='60' src='https://grails.app/your-ens-market-logo.png' />
        </div>
      </div>
    ),
    {
      width: 800,
      height: 418,
    }
  )
}
