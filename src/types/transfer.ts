import type { Address, Hex } from 'viem'
import type { TransferDomainType } from '@/state/reducers/modals/transferModal'
import { ItemType } from './seaport'

export interface TransferEntry {
  domain: TransferDomainType
  token: Address
  tokenId: bigint
  itemType: ItemType.ERC721 | ItemType.ERC1155
}

export interface TransferBatch {
  version: 1 | 2
  contract: Address
  entries: TransferEntry[]
}

export interface TransferTransaction {
  hash: Hex
  version: 1 | 2
}

export type TransferStep = 'review' | 'preparing' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'
