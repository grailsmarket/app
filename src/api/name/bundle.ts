import { API_URL } from '@/constants/api'
import { normalizeName } from '@/lib/ens'
import { APIResponseType, RolesType } from '@/types/api'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import { generateEmptyName } from '@/utils/generateEmptyName'
import { hexToBigInt, labelhash } from 'viem'

export type NameBundleType = {
  details: MarketplaceDomainType
  offers: DomainOfferType[]
  roles: RolesType | null
}

export const fetchNameBundle = async (name: string): Promise<NameBundleType> => {
  try {
    const normalizedName = normalizeName(name)
    const response = await fetch(`${API_URL}/names/${normalizedName}/bundle`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const data = (await response.json()) as APIResponseType<NameBundleType>

    if (!data.success) {
      console.error(data.error?.message || 'Failed to fetch name bundle')
      return {
        details: generateEmptyName(name, hexToBigInt(labelhash(name)).toString()),
        offers: [],
        roles: null,
      }
    } else {
      return data.data
    }
  } catch (err) {
    console.error(err)

    return {
      details: generateEmptyName(name, hexToBigInt(labelhash(name)).toString()),
      offers: [],
      roles: null,
    }
  }
}
