import { MouseEvent, useCallback } from 'react'
import { useAppSelector } from '../state/hooks'
import useModifyCart from './useModifyCart'
import { getRegistrationStatus } from '../utils/getRegistrationStatus'
import { selectMarketplaceDomains } from '../state/reducers/domains/marketplaceDomains'
import { MarketplaceDomainType } from '../types/domains'
import { GRACE_PERIOD, REGISTERED } from '../constants/domains/registrationStatuses'
import { useUserContext } from '@/context/user'

const useCartDomains = () => {
  const { isCartDomainsLoading } = useUserContext()
  const { modifyCart, clearCart, modifyCartLoading } = useModifyCart()
  const { cartRegisteredDomains, cartUnregisteredDomains, modifyingCartTokenIds } =
    useAppSelector(selectMarketplaceDomains)

  const purchaseDomains = cartRegisteredDomains.filter((domain) => domain.listings[0]?.price)
  const offerDomains = cartRegisteredDomains.filter((domain) => !domain.listings[0]?.price)
  const cartIsEmpty = cartRegisteredDomains.length === 0 && cartUnregisteredDomains.length === 0

  const isAddedToCart = useCallback(
    (tokenId: string) => {
      const inCart =
        cartRegisteredDomains.filter((cartDomain) => cartDomain.token_id === tokenId).length > 0 ||
        cartUnregisteredDomains.filter((cartDomain) => cartDomain.token_id === tokenId).length > 0

      return inCart
    },
    [cartRegisteredDomains, cartUnregisteredDomains]
  )

  const isModifyingDomain = useCallback(
    (tokenId: string) => {
      return modifyCartLoading || modifyingCartTokenIds.includes(tokenId)
    },
    [modifyCartLoading, modifyingCartTokenIds]
  )

  const toggleCart = async (domain: MarketplaceDomainType, expireTime: string | null) => {
    if (getRegistrationStatus(expireTime) === GRACE_PERIOD) return

    const registered = getRegistrationStatus(expireTime) === REGISTERED
    const inCart = isAddedToCart(domain.token_id)

    const cartType = registered ? 'sales' : 'registrations'
    return modifyCart({ domain, inCart, cartType })
  }

  const onSelect = (e: MouseEvent, domain: MarketplaceDomainType) => {
    e.stopPropagation()
    toggleCart(domain, domain.expiry_date)
  }

  return {
    purchaseDomains,
    registerDomains: cartUnregisteredDomains,
    offerDomains,
    onSelect,
    cartIsEmpty,
    isAddedToCart,
    clearCart,
    isModifyingDomain,
    isCartDomainsLoading,
    modifyingCartTokenIds,
  }
}

export default useCartDomains
