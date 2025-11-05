import { authFetch } from '../authFetch'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { CartDomainType } from '@/state/reducers/domains/marketplaceDomains'

export const getCart = async (userAddress: `0x${string}` | undefined) => {
  if (!userAddress) {
    console.error('No connected user')
    return null
  }

  const res = await authFetch(`${API_URL}/cart`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  const userCartDomains = (await res.json()) as APIResponseType<{ items: CartDomainType[] }>

  return userCartDomains.data.items
}
