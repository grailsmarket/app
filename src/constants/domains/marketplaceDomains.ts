import { OfferDurationUnitsType, ExtendDurationUnitsType } from '@/state/reducers/domains/marketplaceDomains'
import { MarketplaceHeaderColumn, MarketplaceHeaderItem } from '@/types/domains'

export const MARKETPLACE_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = ['listed_price', 'last_sale', 'highest_offer']
export const PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = [
  'listed_price',
  'last_sale',
  'expires',
]
export const PORTFOLIO_RECEIVED_OFFERS_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = [
  'highest_offer',
  'listed_price',
  'last_sale',
]
export const PORTFOLIO_MY_OFFERS_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = [
  'highest_offer',
  'listed_price',
  'last_sale',
]
export const PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS: MarketplaceHeaderColumn[] = [
  'listed_price',
  'last_sale',
  'highest_offer',
]

export const ALL_MARKETPLACE_COLUMNS: Record<MarketplaceHeaderColumn, MarketplaceHeaderItem> = {
  domain: {
    label: 'Name',
    sort: null,
    value: { asc: 'alphabetical', desc: 'alphabetical_desc' },
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DOMAIN_COLUMN_WIDTHS[columnsLength]
    },
  },
  listed_price: {
    label: 'Listed Price',
    sort: null,
    value: { asc: 'price_low_to_high', desc: 'price_high_to_low' },
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  highest_offer: {
    label: 'Highest Offer',
    sort: null,
    value: { asc: 'highest_offer', desc: 'highest_offer_desc' },
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  registry_price: {
    label: 'Registry Price',
    sort: 'none',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  last_sale: {
    label: 'Last Sale',
    sort: null,
    value: { asc: 'lowest_last_sale', desc: 'highest_last_sale' },
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  expires: {
    label: 'Expiry Date',
    sort: 'none',
    getWidth: (columnsLength: number) => {
      return MARKETPLACE_DETAILS_COLUMN_WIDTHS[columnsLength]
    },
  },
  actions: {
    label: 'Actions',
    sort: 'none',
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
  3: 'w-[55%]',
  4: 'w-[40%]',
  5: 'w-[32.5%]',
  6: 'w-[25%]',
  7: 'w-[17.5%]',
  8: 'w-[16%]',
}

export const MARKETPLACE_DETAILS_COLUMN_WIDTHS: Record<number, string> = {
  3: 'w-[25%]',
  4: 'w-[22.5%]',
  5: 'w-[17.5%]',
  6: 'w-[15%]',
  7: 'w-[13.3%]',
  8: 'w-[12%]',
}

export const MARKETPLACE_ACTIONS_COLUMN_WIDTHS: Record<number, string> = {
  1: 'w-[30%]',
  2: 'w-[30%]',
  3: 'w-[20%]',
  4: 'w-[15%]',
  5: 'w-[15%]',
  6: 'w-[15%]',
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
