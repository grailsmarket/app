import { authFetch } from '../authFetch'

import { CartDomainType } from '@/state/reducers/domains/marketplaceDomains'

import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { MarketplaceDomainType, ModifyCartResponseType } from '@/types/domains'

export interface ModifyCartsVariables {
  domain: MarketplaceDomainType | CartDomainType
  inCart: boolean
  cartType: 'sales' | 'registrations'
}

export const modifyCart = async ({ domain, inCart, cartType }: ModifyCartsVariables) => {
  const response = await authFetch(`${API_URL}/cart${inCart ? `/${(domain as CartDomainType).cartItemId}` : ''}`, {
    method: inCart ? 'DELETE' : 'POST',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      inCart
        ? undefined
        : {
            cartType,
            ensNameId: domain.id,
          }
    ),
  })

  const data = (await response.json()) as APIResponseType<ModifyCartResponseType>

  if (!data.success) {
    throw new Error(data.error)
  }

  const cartItem = inCart
    ? (domain as CartDomainType)
    : ({
        ...domain,
        cartItemId: data.data.cartItemId,
        cartType: data.data.cartType,
      } as CartDomainType)

  return {
    cartItem,
    inCart,
    cartType,
  }
}
