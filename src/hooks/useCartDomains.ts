import { MouseEvent } from 'react'
import { useDispatch } from 'react-redux'

import { useAppSelector } from '../state/hooks'
import useRegisterDomain from './registrar/useRegisterDomain'

import useModifyCart from './useModifyCart'
import { getRegistrationStatus } from '../utils/getRegistrationStatus'

import {
  MarketplaceCheckoutType,
  selectMarketplaceDomains,
  MarketplaceDomainNameType,
  setDomainsCartCheckoutType,
  removeFromMarketplaceDomainsCart,
} from '../state/reducers/domains/marketplaceDomains'
import { MarketplaceDomainType } from '../types/domains'

import { GRACE_PERIOD, REGISTERED } from '../constants/domains/registrationStatuses'

const useCartDomains = () => {
  const dispatch = useDispatch()

  const { cartRegisteredDomains, cartUnregisteredDomains, checkoutType, offerDuration } =
    useAppSelector(selectMarketplaceDomains)

  const { checkOnChainDomainExpirations } = useRegisterDomain()
  const { clearCart, clearCartLoading, modifyCart } = useModifyCart()

  const offerableDomains = cartRegisteredDomains.filter((domain) => !domain.listing_price || domain.offerValue)

  const cartIsEmpty = cartRegisteredDomains.length === 0 && cartUnregisteredDomains.length === 0

  const isAddedToCart = (name: MarketplaceDomainNameType) => {
    const inCart =
      cartRegisteredDomains.filter((cartDomain) => cartDomain.name === name).length > 0 ||
      cartUnregisteredDomains.filter((cartDomain) => cartDomain.name === name).length > 0

    return inCart
  }

  const toggleDomainInCart = (domain: MarketplaceDomainType, expireTime: number) => {
    if (getRegistrationStatus(expireTime) === GRACE_PERIOD) return

    const registered = getRegistrationStatus(expireTime) === REGISTERED

    const inCart = isAddedToCart(domain.name)

    if (registered) {
      const basket = domain.listing_price ? 'PURCHASE' : 'OFFER'
      return modifyCart({ domain, inCart, basket })
    }

    modifyCart({ domain, inCart, basket: 'REGISTER' })
  }

  const toggleCart = async (domain: MarketplaceDomainType, checkExpireTime = true) => {
    if (!checkExpireTime) {
      toggleDomainInCart(domain, domain.expire_time || 0)
      return
    }

    if (isAddedToCart(domain.name)) {
      dispatch(removeFromMarketplaceDomainsCart([domain.name]))
    }

    const expiration = (await checkOnChainDomainExpirations([domain]))[0]
    toggleDomainInCart(domain, expiration)
  }

  const setCheckoutType = (type: MarketplaceCheckoutType) => {
    if (type === checkoutType) return

    if (type === 'Purchase') {
      const areOfferableDomains =
        cartRegisteredDomains.filter((domain) => !domain.listing_price && !domain.offerValue).length > 0

      if (areOfferableDomains) {
        dispatch(setDomainsCartCheckoutType('Offer'))
        return
      }
    }

    dispatch(setDomainsCartCheckoutType(type))
  }

  const onSelect = (e: MouseEvent, domain: MarketplaceDomainType) => {
    e.stopPropagation()
    toggleCart(domain)
  }

  return {
    registeredDomains: cartRegisteredDomains,
    unregisteredDomains: cartUnregisteredDomains,
    offerableDomains,
    isRegisteredEmpty: cartRegisteredDomains.length === 0,
    isUnregisteredEmpty: cartUnregisteredDomains.length === 0,
    cartIsEmpty,
    checkoutType,
    setCheckoutType,
    toggleCart,
    offerDuration,
    onSelect,
    isAddedToCart,
    clearCart,
    clearCartLoading,
  }
}

export default useCartDomains
