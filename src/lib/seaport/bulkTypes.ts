/**
 * Seaport Bulk Signing Types
 * Ported from backend SDK for frontend use.
 */

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

export interface SeaportOfferItem {
  itemType: ItemType
  token: string
  identifierOrCriteria: string
  startAmount: string
  endAmount: string
}

export interface SeaportConsiderationItem extends SeaportOfferItem {
  recipient: string
}

export interface SeaportOrder {
  offerer: string
  zone: string
  offer: SeaportOfferItem[]
  consideration: SeaportConsiderationItem[]
  orderType: OrderType
  startTime: number
  endTime: number
  zoneHash: string
  salt: string
  conduitKey: string
  totalOriginalConsiderationItems: number
  signature?: string
}

export interface BuildBulkOfferOrdersParams {
  offers: Array<{
    tokenId: string
    offerAmountWei: string
  }>
  offerer: string
  durationDays?: number
}

export interface BulkSignatureResult {
  leaves: string[]
  treeHeight: number
  merkleRoot: string
  typedData: {
    domain: Record<string, any>
    types: Record<string, any[]>
    primaryType: string
    message: Record<string, any>
  }
  paddedCount: number
}

export interface IndividualBulkSignature {
  orderIndex: number
  order: SeaportOrder
  signature: string
}

export interface NOfManyOfferResponse {
  groupId: number
  targetCount: number
  totalItems: number
  created: number
  results: Array<{ index: number; offerId: number }>
}
