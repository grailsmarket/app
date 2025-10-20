import { Address } from 'viem'
import { SortFilterType } from '../state/reducers/filters/marketplaceFilters'
import { ALL_REGISTRATION_STATUSES } from '@/constants/domains/registrationStatuses'

export type MarketplaceDomainType = {
  name: string
  token_id: number
  owner: Address | null
  expiry_date: string | null
  registration_date: number | null
  metadata: Record<string, string>
  has_numbers: boolean
  has_emoji: boolean
  clubs: string[]
  listings: DomainListingType[]
  highest_offer: string | null
  offer: string | null
  last_sale_price: string | null
  last_sale_asset: string | null
}

export type DomainListingType = {
  id: number
  price: string
  currency_address: string
  status: string
  seller_address: string
  order_hash: string
  order_data: Record<string, unknown>
  expires_at: string
  created_at: string
  source: string
}

// Names API item
// "name": "_vitalik.eth",
// "token_id": "114908560202028942467862703253656492567899290430658454902987364571129807569325",
// "owner": "0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401",
// "price": null,
// "expiry_date": "2026-07-10T22:32:29.000Z",
// "registration_date": null,
// "character_count": 8,
// "has_numbers": false,
// "has_emoji": false,
// "status": "unlisted",
// "tags": [],
// "listing_created_at": null,
// "active_offers_count": "0",
// "highest_offer": null,
// "score": 239.69748

// Listing API item
// "id": 5313,
//         "price_wei": "500000000000000000",
//         "status": "active",
//         "created_at": "2025-10-03T07:37:35.909Z",
//         "order_hash": "0x547dc41eaddddee1ab5ed1614970df411a28692e87d6063104960676ccfbc81e",
//         "order_data": {
//           "item": {
//             "chain": {
//               "name": "ethereum"
//             },
//             "nft_id": "ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/75459034824557551554959410857536501440204928037007196901583449453605703119269",
//             "metadata": {
//               "name": "revitalize.eth",
//               "traits": [
//                 {
//                   "value": "1646535824",
//                   "trait_type": "Created Date"
//                 },
//                 {
//                   "value": "10",
//                   "trait_type": "Length"
//                 },
//                 {
//                   "value": "10",
//                   "trait_type": "Segment Length"
//                 },
//                 {
//                   "value": "letter",
//                   "trait_type": "Character Set"
//                 },
//                 {
//                   "value": "1750831259",
//                   "trait_type": "Registration Date"
//                 },
//                 {
//                   "value": "1771221659",
//                   "trait_type": "Expiration Date"
//                 }
//               ],
//               "image_url": "https://i2c.seadn.io/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/8c4b3c4c32e95ba453661fb4c10d19/f08c4b3c4c32e95ba453661fb4c10d19.svg",
//               "description": "revitalize.eth, an ENS name.",
//               "metadata_url": null,
//               "animation_url": null,
//               "background_color": null
//             },
//             "permalink": "https://opensea.io/item/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/75459034824557551554959410857536501440204928037007196901583449453605703119269"
//           },
//           "chain": "ethereum",
//           "maker": {
//             "address": "0x1badb16fdf023a4882bb9adfc780280e863c86be"
//           },
//           "taker": {
//             "address": "0x0000000000000000000000000000000000000000"
//           },
//           "quantity": 1,
//           "base_price": "500000000000000000",
//           "collection": {
//             "slug": "ens"
//           },
//           "is_private": false,
//           "order_hash": "0x547dc41eaddddee1ab5ed1614970df411a28692e87d6063104960676ccfbc81e",
//           "listing_date": "2025-10-03T07:37:28.000000Z",
//           "listing_type": null,
//           "payment_token": {
//             "name": "Ether",
//             "symbol": "ETH",
//             "address": "0x0000000000000000000000000000000000000000",
//             "decimals": 18,
//             "eth_price": "0.5",
//             "usd_price": "2231.4174080294583672592133827575665"
//           },
//           "protocol_data": {
//             "signature": "0x4bb52c1c12a5f1340ad8de4860b0df1bb0663228c623da466f2f9b7a2abf3067ef9c5361c99fad1f1e254704f74993fbc3836009d4c97cc45c5cb86da2da6981000022c26534cbf51152cb66c460d943dbbc7333ed146ae37b615d220bc35cea611fa3a935cd886885aac8e75dec023f3dc7ccc71cb2a4c81916431eafb8dbd05d334fceafa3b5511f8d70d438135036ee2724bf527c8cafd30a102047d0b370fdcbb2439689690f38d6c9dd13cf2ad0cf8b26d26a83c8771634283893c3ce4d95fb89d13768cd41158f8cbb5687bb609b8602614a1c6a036c1b342698cb69d74c8f4ffe7185b2172235198dc387a938208787214d6230ca0fafab9403fa8d389fda5e",
//             "parameters": {
//               "salt": "27855337018906766782546881864045825683096516384821792734251495203570685176627",
//               "zone": "0x0000000000000000000000000000000000000000",
//               "offer": [
//                 {
//                   "token": "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85",
//                   "itemType": 2,
//                   "endAmount": "1",
//                   "startAmount": "1",
//                   "identifierOrCriteria": "75459034824557551554959410857536501440204928037007196901583449453605703119269"
//                 }
//               ],
//               "counter": "0x0",
//               "endTime": "1760081848",
//               "offerer": "0x1badb16fdf023a4882bb9adfc780280e863c86be",
//               "zoneHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
//               "orderType": 0,
//               "startTime": "1759477048",
//               "conduitKey": "0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000",
//               "consideration": [
//                 {
//                   "token": "0x0000000000000000000000000000000000000000",
//                   "itemType": 0,
//                   "endAmount": "495000000000000000",
//                   "recipient": "0x1badb16fdf023a4882bb9adfc780280e863c86be",
//                   "startAmount": "495000000000000000",
//                   "identifierOrCriteria": "0"
//                 },
//                 {
//                   "token": "0x0000000000000000000000000000000000000000",
//                   "itemType": 0,
//                   "endAmount": "5000000000000000",
//                   "recipient": "0x0000a26b00c1f0df003000390027140000faa719",
//                   "startAmount": "5000000000000000",
//                   "identifierOrCriteria": "0"
//                 }
//               ],
//               "totalOriginalConsiderationItems": 2
//             }
//           },
//           "event_timestamp": "2025-10-03T07:37:35.779384Z",
//           "expiration_date": "2025-10-10T07:37:28.000000Z",
//           "protocol_address": "0x0000000000000068f116a894984e2db1123eb395"
//         },
//         "seller_address": "0x1badb16fdf023a4882bb9adfc780280e863c86be",
//         "ens_name": "revitalize.eth",
//         "token_id": "75459034824557551554959410857536501440204928037007196901583449453605703119269",
//         "current_owner": "0x1badb16fdf023a4882bb9adfc780280e863c86be",
//         "name_expiry_date": "2026-02-16T06:00:59.000Z",
//         "registration_date": null

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

export type CartDomainAPIType = {
  basket: DomainBasketType
  id: string
} & MarketplaceDomainType

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
  | 'listed_price'
  | 'registry_price'
  | 'last_sale'
  | 'highest_offer'
  | 'expires'
  | 'actions'

export type MarketplaceHeaderItem = {
  label: string
  sort: 'asc' | 'desc' | 'none' | null
  value?: {
    asc?: SortFilterType
    desc?: SortFilterType
  }
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
    tokenId: number
    ownerAddress: Address | null
    hasActiveListing: boolean
    listingPrice: string | null
    expiryDate: string | null
  }
}

export type RegistrationStatus = (typeof ALL_REGISTRATION_STATUSES)[number]
