import { MouseEvent } from 'react'
import { useAppSelector } from '../state/hooks'
import useModifyCart from './useModifyCart'
import { getRegistrationStatus } from '../utils/getRegistrationStatus'
import { selectMarketplaceDomains } from '../state/reducers/domains/marketplaceDomains'
import { MarketplaceDomainType } from '../types/domains'
import { GRACE_PERIOD, REGISTERED } from '../constants/domains/registrationStatuses'

const useCartDomains = () => {
  const { modifyCart, clearCart } = useModifyCart()
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)

  const purchaseDomains = cartRegisteredDomains.filter((domain) => domain.listings[0]?.price)
  const offerDomains = cartRegisteredDomains.filter((domain) => !domain.listings[0]?.price)
  const cartIsEmpty = cartRegisteredDomains.length === 0 && cartUnregisteredDomains.length === 0

  const isAddedToCart = (tokenId: string) => {
    const inCart =
      cartRegisteredDomains.filter((cartDomain) => cartDomain.token_id === tokenId).length > 0 ||
      cartUnregisteredDomains.filter((cartDomain) => cartDomain.token_id === tokenId).length > 0

    return inCart
  }

  const toggleCart = async (domain: MarketplaceDomainType, expireTime: string | null) => {
    if (getRegistrationStatus(expireTime) === GRACE_PERIOD) return

    const registered = getRegistrationStatus(expireTime) === REGISTERED
    const inCart = isAddedToCart(domain.token_id)

    const basket = registered ? 'PURCHASE' : 'REGISTER'
    return modifyCart({ domain, inCart, basket })
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
  }
}

export default useCartDomains
