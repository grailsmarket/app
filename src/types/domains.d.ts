import { Address, Hex } from 'viem'
import { ALL_REGISTRATION_STATUSES } from '@/constants/domains/registrationStatuses'

export type MarketplaceDomainType = {
  id: number
  name: string
  token_id: string
  owner: Address | null
  expiry_date: string | null
  registration_date: string | null
  creation_date: string | null
  metadata: Record<string, string>
  has_numbers: boolean
  has_emoji: boolean
  clubs: string[]
  club_ranks: { club: string; rank: number }[] | null
  listings: DomainListingType[]
  highest_offer_wei: string | null
  highest_offer_id: number | null
  highest_offer_currency: Address | null
  offer: string | null
  last_sale_price: string | null
  last_sale_price_usd: string | null
  last_sale_currency: string | null
  last_sale_date: string | null
  view_count: number
  watchers_count: number
  downvotes: number
  upvotes: number
  watchlist_record_id: number | null
  watchlist?: {
    notifyOnSale: boolean
    notifyOnOffer: boolean
    notifyOnListing: boolean
    notifyOnPriceChange: boolean
  }
}

export type DomainListingType = {
  id: number
  price: string
  price_wei: string
  currency_address: Address
  status: string
  seller_address: string
  order_hash: string
  order_data: DomainOfferOrderDataType
  expires_at: string
  created_at: string
  source: string
  broker_address: Address | null
  broker_fee_bps: number | null
}

export type DomainOfferType = {
  id: number
  ens_name_id: number
  buyer_address: Address
  offer_amount_wei: string
  currency_address: Address
  status: string
  created_at: string
  expires_at: string
  source: string
  name: string
  token_id: string
  order_data: DomainOfferOrderDataType
  order_hash: Hex
}

export type DomainOfferOrderDataType = {
  orderHash: Address
  signature: Hex
  parameters: {
    salt: Hex
    zone: Address
    offer: [
      {
        token: Address
        itemType: number
        endAmount: string
        startAmount: string
        identifierOrCriteria: Hex
      },
    ]
    counter: string
    endTime: string
    offerer: Address
    zoneHash: Hex
    orderType: number
    startTime: string
    conduitKey: Address
    consideration: [
      {
        token: Address
        itemType: number
        endAmount: string
        recipient: Address
        startAmount: string
        identifierOrCriteria: Hex
      },
    ]
    totalOriginalConsiderationItems: number
  }
  marketplace: 'grails'
  usesConduit: true
  protocol_data: {
    signature: Hex
    conduitKey: Hex
    parameters: {
      salt: Hex
      zone: Address
      offer: [
        {
          token: Address
          itemType: number
          endAmount: string
          startAmount: string
          identifierOrCriteria: Hex
        },
      ]
      counter: string
      endTime: string
      offerer: Address
      zoneHash: Hex
      orderType: number
      startTime: string
      conduitKey: Address
      consideration: [
        {
          token: Address
          itemType: number
          endAmount: string
          recipient: Address
          startAmount: string
          identifierOrCriteria: Hex
        },
      ]
      totalOriginalConsiderationItems: number
    }
    conduitAddress: Address
  }
}

export type ActivityEventType = 'sale' | 'purchase' | 'transfer' | 'registration' | 'expiration'

export type DomainsActivityType = {
  asset: string
  domain: string
  end_time: number
  event_type: ActivityEventType
  from_addr: string
  price: string
  start_time: number
  taxonomies?: [string]
  terms?: [string]
  to_addr: string
}

export type DomainRegisterType = {
  name: string
  owner: `0x${string}`
  duration: string | number
  secret: string
}

export type WatchlistDomainType = {
  name: string
  name_ens: string
  price: string
  terms: string[]
  user: string
  domain_id: string
  taxonomies: string[]
  expire_time: number
}

export type DomainBasketType = 'PURCHASE' | 'OFFER' | 'REGISTER'

export type ModifyCartResponseType = {
  cartItemId: number
  cartType: 'sales' | 'registrations'
  ensNameId: number
  ensName: string
  message: string
}

export type CategoriesResponseType = {
  domain: string
  categories: string[]
}

export type ExpiryDateResponseType = {
  domain: string
  expires: number
}

export type TotalStatsType = {
  average_sale: string
  daily_sales: string
  highest_reg: string
  highest_reg_domain_name: string
  highest_sale: string
  last_reg: string
  last_reg_domain_name: string
  last_sale: string
  last_sale_domain_name: string
  reg_volume_day: string
  trending_category: string
  trending_category_volume: string
  volume_day: string
  volume_month: string
  volume_week: string
}

export type ListingFunctionsPropsType = {
  tokenId: string
  collectionId: string
  name: string
  price?: number
}

export type RegistrationDomainCommitType = {
  secret: `0x${string}`
  owner: `0x${string}`
  name: string
}

export type MarketplaceHeaderColumn =
  | 'domain'
  | 'price'
  | 'last_sale'
  | 'highest_offer'
  | 'expires'
  | 'actions'
  | 'owner'

export type MarketplaceHeaderItem = {
  label: string
  getWidth: (columnsLength: number) => string
}

export type WatchlistItemType = {
  id: number
  userId: number
  ensNameId: number
  ensName: string
  notifyOnSale: boolean
  notifyOnOffer: boolean
  notifyOnListing: boolean
  notifyOnPriceChange: boolean
  addedAt: string
  nameData: {
    name: string
    tokenId: string
    activeListing: DomainListingType | null
    ownerAddress: Address | null
    hasActiveListing: boolean
    listingPrice: string | null
    expiryDate: string | null
  }
}

export type WatchlistEntryType = {
  addedAt: string
  ensName: string
  ensNameId: number
  id: number
  listId?: number
  listName?: string
  notifyOnListing: boolean
  notifyOnOffer: boolean
  notifyOnPriceChange: boolean
  notifyOnSale: boolean
}

export type WatchlistListType = {
  id: number
  name: string
  isDefault: boolean
  itemCount: number
  createdAt: string
  updatedAt: string
}

export type WatchlistCheckListEntry = {
  listId: number
  listName: string
  listIsDefault: boolean
  watchlistEntryId: number
  notifyOnSale: boolean
  notifyOnOffer: boolean
  notifyOnListing: boolean
  notifyOnPriceChange: boolean
}

export type RegistrationStatus = (typeof ALL_REGISTRATION_STATUSES)[number]

export type CategoryType = {
  name: string
  display_name: string
  description: string
  member_count: number
  floor_price_wei: string
  floor_price_currency: Address
  total_sales_count: number
  total_sales_volume_wei: string
  last_floor_update: string
  last_sales_update: string
  sales_count_1mo: number
  sales_count_1w: number
  sales_count_1y: number
  sales_volume_wei_1mo: string
  sales_volume_wei_1w: string
  sales_volume_wei_1y: string
  reg_count_1mo: number
  reg_count_1w: number
  reg_count_1y: number
  total_reg_count: number
  total_reg_volume_wei: string
  reg_volume_wei_1mo: string
  reg_volume_wei_1w: string
  reg_volume_wei_1y: string
  created_at: string
  updated_at: string
  premium_count: number
  available_count: number
  classifications: string[]
  holders_count: number
  holders_ratio: number
  registered_count: number
  grace_count: number
  listings_count: number
  registered_percent: number
  grace_percent: number
  listings_percent: number
}

export type NameActivityType = {
  id: number
  name: string
  event_type: ProfileActivityEventType
  actor_address: Address | null
  counterparty_address: Address | null
  platform: string
  chain_id: number
  price_wei: string
  currency_address: Address | null
  transaction_hash: string | null
  block_number: number | null
  created_at: string
  token_id: string | null
}

export type ActivityColumnType = 'event' | 'name' | 'price' | 'user' | 'from' | 'to' | 'time'

export type OfferColumnType = 'name' | 'offer_amount' | 'offerrer' | 'expires' | 'actions'
