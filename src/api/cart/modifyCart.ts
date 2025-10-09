import { authFetch } from '../authFetch'

import { CartRegisteredDomainType, CartUnregisteredDomainType } from '@/state/reducers/domains/marketplaceDomains'
import { DomainBasketType, MarketplaceDomainType } from '@/types/domains'

import { API_URL } from '@/constants/api'

export interface ModifyCartsVariables {
  domain: MarketplaceDomainType | CartRegisteredDomainType | CartUnregisteredDomainType
  inCart: boolean
  basket: DomainBasketType
}

export const modifyCart = async ({ domain, inCart, basket }: ModifyCartsVariables) => {
  await authFetch(`${API_URL}/user/cart/modify`, {
    method: inCart ? 'DELETE' : 'POST',
    mode: 'cors',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      basket,
      id: domain.name,
    }),
  })

  return {
    domain,
    inCart,
    basket,
  }
}
