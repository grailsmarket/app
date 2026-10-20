import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType } from '@/types/domains'
import { hexToBigInt, labelhash } from 'viem'
import { normalizeName } from '@/lib/ens'
import { generateEmptyName } from '@/utils/generateEmptyName'

export const fetchNameVersion = async (name: string): Promise<1 | 2> => {
  const response = await fetch(`${API_URL}/names/${normalizeName(name)}`, { signal: AbortSignal.timeout(5_000) })
  if (!response.ok) throw new Error('Could not verify this name’s ENS version.')
  const result = (await response.json()) as APIResponseType<MarketplaceDomainType>
  const version = result.data?.version
  if (!result.success || (version !== 1 && version !== 2)) throw new Error('This name’s ENS version is unknown.')
  return version
}

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
