import { OfferDurationUnitsType, ExtendDurationUnitsType } from '@/state/reducers/domains/marketplaceDomains'
import { MarketplaceHeaderItem } from '@/types/domains'

export const MARKETPLACE_DOMAIN_TABLE_HEADERS: MarketplaceHeaderItem[] = [
  {
    label: 'Domain',
    sort: null,
    value: { asc: 'alphabetical', desc: 'alphabetical_desc' },
  },
  {
    label: 'Listed Price',
    sort: null,
    value: { asc: 'price_low_to_high', desc: 'price_high_to_low' },
  },
  { label: 'Registry Price', sort: 'none' },
  {
    label: 'Last Sale',
    sort: null,
    value: { asc: 'lowest_last_sale', desc: 'highest_last_sale' },
  },
  { label: '', sort: 'none' },
]

export const MARKETPLACE_DOMAIN_DURATION_UNITS_VALUES: OfferDurationUnitsType[] = ['Month', 'Week', 'Day']

export const EXTEND_DOMAIN_DURATION_UNITS_VALUES: ExtendDurationUnitsType[] = ['Month', 'Year']

export const MARKETPLACE_ROW_WIDTHS = ['29.8%', '13.3%', '17.3%', '13.3%', '13.3%', '13%']
