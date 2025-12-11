import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { hexToBigInt, labelhash } from 'viem'
import { normalizeName } from '@/lib/ens'

export const fetchNameDetails = async (name: string) => {
  try {
    const response = await fetch(`${API_URL}/names/${normalizeName(name)}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const data = (await response.json()) as APIResponseType<MarketplaceDomainType>

    if (!data.success) throw new Error(data.error)

    return data.data
  } catch (err) {
    console.error(err)
    return {
      id: 0,
      name,
      token_id: hexToBigInt(labelhash(name)).toString(),
      owner: null,
      expiry_date: null,
      registration_date: null,
      metadata: {},
      has_numbers: false,
      has_emoji: false,
      clubs: [],
      listings: [],
      highest_offer_wei: null,
      highest_offer_id: null,
      highest_offer_currency: null,
      offer: null,
      last_sale_price: null,
      last_sale_price_usd: null,
      last_sale_currency: null,
      last_sale_date: null,
      view_count: 0,
      watchers_count: 0,
      downvotes: 0,
      upvotes: 0,
    }
  }
}
