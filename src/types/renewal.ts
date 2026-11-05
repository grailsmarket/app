import { MarketplaceDomainType } from './domains'
import { Hex } from 'viem'

export interface RenewalEntry {
  domain: MarketplaceDomainType
  label: string
  version: 1 | 2
  duration: bigint
  currentExpiry: number
}

export interface RenewalBatch {
  version: 1 | 2
  entries: RenewalEntry[]
}

export type RenewalStage = 'approving' | 'confirming' | 'processing'

export interface RenewalTransaction {
  hash: Hex
  version: 1 | 2
}
