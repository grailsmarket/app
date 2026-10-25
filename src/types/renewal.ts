import { MarketplaceDomainType } from './domains'
import { Hex } from 'viem'

export interface RenewalEntry {
  domain: MarketplaceDomainType
  label: string
  version: 1 | 2
  duration: bigint
  currentExpiry: number
}

/**
 * How a batch pays. 'eth': the legacy v1 BulkRenewal contract. 'token': BulkRegistrationV2.multiRenew
 * in USDC/DAI, which renews v2 names through the ETHRegistrar and v1 names through ETHRenewerV1.
 */
export type RenewalPayment = 'eth' | 'token'

export interface RenewalBatch {
  version: 1 | 2
  payment: RenewalPayment
  entries: RenewalEntry[]
}

export type RenewalStage = 'approving' | 'confirming' | 'processing'

export interface RenewalTransaction {
  hash: Hex
  version: 1 | 2
}
