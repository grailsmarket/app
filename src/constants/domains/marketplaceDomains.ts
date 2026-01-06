import { OfferDurationUnitsType, ExtendDurationUnitsType } from '@/state/reducers/domains/marketplaceDomains'
import { MarketplaceHeaderColumn, MarketplaceHeaderItem, OfferColumnType } from '@/types/domains'

export const MARKETPLACE_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = ['price', 'owner', 'last_sale', 'highest_offer']
export const PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = ['expires', 'price', 'last_sale']
export const PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = ['price', 'expires', 'last_sale']
export const PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS: OfferColumnType[] = [
  'name',
  'offer_amount',
  'offerrer',
  'expires',
  'actions',
]
export const PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS: OfferColumnType[] = ['name', 'offer_amount', 'expires', 'actions']
export const PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = ['price', 'last_sale', 'highest_offer']

export const ALL_MARKETPLACE_COLUMNS: Record<MarketplaceHeaderColumn, MarketplaceHeaderItem> = {
  domain: {
    label: 'Name',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DOMAIN_COLUMN_WIDTHS[columnsLength]
    },
  },
  price: {
    label: 'Price',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  owner: {
    label: 'Owner',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  highest_offer: {
    label: 'Highest Offer',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  // registry_price: {
  //   label: 'Registry Price',
  //   getWidth: (columnsLength: number) => {
  //     return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
  //   },
  // },
  last_sale: {
    label: 'Last Sale',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  expires: {
    label: 'Expiry Date',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  actions: {
    label: 'Actions',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_ACTIONS_COLUMN_WIDTHS[columnsLength]
    },
  },
}

export const MARKETPLACE_DOMAIN_DURATION_UNITS_VALUES: OfferDurationUnitsType[] = ['Month', 'Week', 'Day']

export const EXTEND_DOMAIN_DURATION_UNITS_VALUES: ExtendDurationUnitsType[] = ['Month', 'Year']

export const MARKETPLACE_DOMAIN_COLUMN_WIDTHS: Record<number, string> = {
  1: 'w-[100%]',
  2: 'w-[70%]',
  3: 'w-[45%]',
  4: 'w-[35%]',
  5: 'w-[32.5%]',
  6: 'w-[25%]',
  7: 'w-[17.5%]',
  8: 'w-[16%]',
}

export const MARKETPLACE_DETAILS_COLUMN_WIDTHS: Record<number, string> = {
  3: 'w-[30%]',
  4: 'w-[25%]',
  5: 'w-[20%]',
  6: 'w-[15%]',
  7: 'w-[13.3%]',
  8: 'w-[12%]',
}

export const MARKETPLACE_ACTIONS_COLUMN_WIDTHS: Record<number, string> = {
  1: 'w-[15%]',
  2: 'w-[30%]',
  3: 'w-[15%]',
  4: 'w-[15%]',
  5: 'w-[10%]',
  6: 'w-[10%]',
  7: 'w-[15%]',
  8: 'w-[12%]',
}

export const MARKETPLACE_GRID_ROW_COUNT_WIDTHS: Record<number, number> = {
  400: 1,
  80: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  1: 8,
}

export const CATEGORY_LABELS = {
  prepunks: 'Prepunk',
  '10k': '10k Club',
  pokemon: 'Pokemon',
  '1kforenames': '1k Forenames',
  '1ksurnames': '1k Surnames',
  '999': '999 Club',
  single_ethmoji: 'Single Ethmoji',
  triple_ethmoji: 'Triple Ethmoji',
  ethmoji_99: 'Ethmoji 99',
  ethmoji_999: 'Ethmoji 999',
  base_single_ethmoji: 'Base Single Ethmoji',
  prepunk_100: 'Prepunk 100',
  prepunk_1k: 'Prepunk 1k',
  prepunk_10k: 'Prepunk 10k',
  un_capital_cities: 'UN Capital Cities',
  un_countries: 'UN Countries',
  bip_39: 'BIP 39',
  periodic_table: 'Periodic Table',
  english_adjectives: 'English Adjectives',
  wikidata_top_nouns: 'Top Nouns',
  wikidata_top_fantasy_char: 'Top Fantasy',
  '3_letter_palindromes': '3 Letter Palindromes',
  '3_digit_palindromes': '3 Digit Palindromes',
  '4_digit_palindromes': '4 Digit Palindromes',
  '5_digit_palindromes': '5 Digit Palindromes',
  '6_digit_palindromes': '6 Digit Palindromes',
  '100k_club': '100k Club',
  double_ethmoji: 'Double Ethmoji',
  double_triple_digits: 'Double Triple Digits',
  ethmoji_10k: 'Ethmoji 10k',
  prepunk_digits: 'Prepunk Digits',
  quad_ethmoji: 'Quad Ethmoji',
  quint_ethmoji: 'Quint Ethmoji',
  top_crypto_names: 'Top Crypto Names',
  top_crypto_tickers: 'Top Crypto Tickers',
  top_cities_global: 'Top Cities Global',
  top_cities_usa: 'Top Cities USA',
  us_states: 'US States',
} as const
