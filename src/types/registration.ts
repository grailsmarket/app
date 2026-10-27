import { Address, Hex } from 'viem'
import { MarketplaceDomainType } from './domains'

export type RegistrationFlowState =
  | 'review'
  | 'resolver'
  | 'committing'
  | 'waiting'
  | 'registering'
  | 'success'
  | 'error'

export interface RegistrationParameters {
  account: Address
  chainId: number
  owner: Address
  resolver: Address | null
  durations: string[]
  asset: Address
}
export type RegistrationMode = 'register_for' | 'register_to'
export type TimeUnit = 'days' | 'weeks' | 'months' | 'years' | 'custom'

export interface NameRegistrationEntry {
  name: string
  domain: MarketplaceDomainType
  registrationMode: RegistrationMode | null
  quantity: number | null
  timeUnit: TimeUnit | null
  customDuration: number | null
  calculatedDuration: string | null
  isAvailable: boolean | null
}

export interface BatchState {
  batchIndex: number
  nameIndices: number[]
  commitmentHashes: Hex[] | null
  commitTxHash: Hex | null
  commitmentTimestamp: number | null
  registerTxHash: Hex | null
  committed: boolean
  registered: boolean
}

export interface CalculationResults {
  durationSeconds: bigint
  durationYears: number
  priceUSD: number
  priceETH: number
  durationDiscount: { amount: number; percentage: number } | null
  isBelowMinimum: boolean
  isLoadingPrice: boolean
}

export interface SufficientBalanceResults {
  hasSufficientAssets: boolean
  hasSufficientEth: boolean
}
