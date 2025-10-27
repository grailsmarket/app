import { Address } from 'viem'

export type ProfileActivityEventType =
  | 'listed'
  | 'offer_made'
  | 'bought'
  | 'sold'
  | 'offer_accepted'
  | 'cancelled'
  | 'mint'
  | 'burn'
  | 'sent'
  | 'received'

export type ProfileActivityType = {
  id: number
  name: string
  ens_name_id: number
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
  price: string | null
  token_id: string
  metadata: Record<string, unknown>
}
