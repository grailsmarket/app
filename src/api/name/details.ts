import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { hexToBigInt, labelhash } from 'viem'
import { normalizeName } from '@/lib/ens'
import { generateEmptyName } from '@/utils/generateEmptyName'

export const fetchNameDetails = async (name: string) => {
  try {
    const response = await fetch(`${API_URL}/names/${normalizeName(name)}`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const data = (await response.json()) as APIResponseType<MarketplaceDomainType>

    if (!data.success) throw new Error(data.error?.message || 'Failed to fetch name details')

    return data.data
  } catch (err) {
    console.error(err)

    const domain = generateEmptyName(name, hexToBigInt(labelhash(name)).toString())
    return domain
  }
}
