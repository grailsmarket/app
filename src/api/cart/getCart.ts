import { authFetch } from '../authFetch'
import { CartDomainAPIType } from '@/types/domains'
import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'

export const getCart = async (userAddress: `0x${string}` | undefined) => {
  if (!userAddress) return null

  const res = await authFetch(`${API_URL}/user/cart/list`, {
    method: 'GET',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  const userCartDomains = (await res.json()) as APIResponseType<{ cart: CartDomainAPIType[] }>

  return userCartDomains.data.cart
}
