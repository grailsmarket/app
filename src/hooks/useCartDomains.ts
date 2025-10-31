import { MouseEvent } from 'react'
import { useAppSelector } from '../state/hooks'
import useModifyCart from './useModifyCart'
import { getRegistrationStatus } from '../utils/getRegistrationStatus'
import { selectMarketplaceDomains, MarketplaceDomainNameType } from '../state/reducers/domains/marketplaceDomains'
import { MarketplaceDomainType } from '../types/domains'
import { GRACE_PERIOD, REGISTERED } from '../constants/domains/registrationStatuses'

const useCartDomains = () => {
  const { clearCart, clearCartLoading, modifyCart } = useModifyCart()
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)

  const offerableDomains = cartRegisteredDomains.filter((domain) => !domain.listings[0].price || domain.offerValue)
  const cartIsEmpty = cartRegisteredDomains.length === 0 && cartUnregisteredDomains.length === 0

  const isAddedToCart = (name: MarketplaceDomainNameType) => {
    const inCart =
      cartRegisteredDomains.filter((cartDomain) => cartDomain.name === name).length > 0 ||
      cartUnregisteredDomains.filter((cartDomain) => cartDomain.name === name).length > 0

    return inCart
  }

  const toggleCart = async (domain: MarketplaceDomainType, expireTime: string | null) => {
    if (getRegistrationStatus(expireTime) === GRACE_PERIOD) return

    const registered = getRegistrationStatus(expireTime) === REGISTERED
    const inCart = isAddedToCart(domain.name)

    if (registered) modifyCart({ domain, inCart, basket: 'PURCHASE' })
    else modifyCart({ domain, inCart, basket: 'REGISTER' })
  }

  const onSelect = (e: MouseEvent, domain: MarketplaceDomainType) => {
    e.stopPropagation()
    toggleCart(domain, domain.expiry_date)
  }

  return {
    registeredDomains: cartRegisteredDomains,
    unregisteredDomains: cartUnregisteredDomains,
    offerableDomains,
    isRegisteredEmpty: cartRegisteredDomains.length === 0,
    isUnregisteredEmpty: cartUnregisteredDomains.length === 0,
    cartIsEmpty,
    toggleCart,
    onSelect,
    isAddedToCart,
    clearCart,
    clearCartLoading,
  }
}

export default useCartDomains
