import { Address } from 'viem'

export interface SeaportOrderParameters {
  offerer: Address
  zone: Address
  offer: OfferItem[]
  consideration: ConsiderationItem[]
  orderType: number
  startTime: bigint
  endTime: bigint
  zoneHash: Address
  salt: Address
  conduitKey: Address
  totalOriginalConsiderationItems: number
}

export interface OfferItem {
  itemType: number
  token: Address
  identifierOrCriteria: bigint
  startAmount: bigint
  endAmount: bigint
}

export interface ConsiderationItem extends OfferItem {
  recipient: Address
}

export interface SeaportOrder {
  parameters: SeaportOrderParameters
  signature: Address
}

export interface FulfillmentComponent {
  orderIndex: number
  itemIndex: number
}

export interface Fulfillment {
  offerComponents: FulfillmentComponent[]
  considerationComponents: FulfillmentComponent[]
}

export interface AdvancedOrder {
  parameters: SeaportOrderParameters
  signature: Address
  numerator: bigint
  denominator: bigint
  extraData: Address
}

export enum OrderType {
  FULL_OPEN = 0,
  PARTIAL_OPEN = 1,
  FULL_RESTRICTED = 2,
  PARTIAL_RESTRICTED = 3,
  CONTRACT = 4,
}

export enum ItemType {
  NATIVE = 0,
  ERC20 = 1,
  ERC721 = 2,
  ERC1155 = 3,
  ERC721_WITH_CRITERIA = 4,
  ERC1155_WITH_CRITERIA = 5,
}

export interface Listing {
  id: number
  ens_name_id: number
  seller_address: Address
  price_wei: string
  currency_address: Address
  order_hash?: string
  order_data: Record<string, unknown> // Seaport order data
  status: 'active' | 'sold' | 'cancelled' | 'expired'
  source?: 'grails' | 'opensea'
  created_at: string
  updated_at: string
  expires_at?: string
  // Additional fields from ENS join
  name?: string // From search API
  ens_name?: string
  token_id?: string
  current_owner?: string
  name_expiry_date?: string
  registration_date?: string
  last_sale_date?: string
}
