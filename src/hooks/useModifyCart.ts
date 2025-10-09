import { useAccount } from 'wagmi'
import { useMutation } from '@tanstack/react-query'

import { useAppDispatch, useAppSelector } from '../state/hooks'

import { clearCart } from '../api/user/mutate/clearCart'
import { ModifyCartsVariables, modifyCart } from '../api/user/mutate/modifyCart'

import {
  CartRegisteredDomainType,
  selectMarketplaceDomains,
  addToCartRegisteredDomains,
  setDomainsCartCheckoutType,
  clearMarketplaceDomainsCart,
  addToCartUnregisteredDomains,
  removeFromMarketplaceDomainsCart,
} from '../state/reducers/domains/marketplaceDomains'

const useModifyCart = () => {
  const dispatch = useAppDispatch()

  const { cartRegisteredDomains } = useAppSelector(selectMarketplaceDomains)
  const { address: userAddress } = useAccount()

  const updateRegisteredCheckoutType = (domains: CartRegisteredDomainType[]) => {
    const areOfferableDomains = domains.filter((domain) => !domain.listing_price).length > 0

    if (areOfferableDomains) {
      dispatch(setDomainsCartCheckoutType('Offer'))
    } else {
      dispatch(setDomainsCartCheckoutType('Purchase'))
    }
  }

  const modifyCartLocal = ({ domain, inCart, basket }: ModifyCartsVariables) => {
    if (inCart) {
      dispatch(removeFromMarketplaceDomainsCart([domain.name]))
      if (basket === 'REGISTER') return

      return updateRegisteredCheckoutType(cartRegisteredDomains.filter((d) => d.name !== domain.name))
    }

    if (basket === 'REGISTER') {
      dispatch(
        addToCartUnregisteredDomains([
          {
            ...domain,
            registrationPeriod: 1,
          },
        ])
      )
    }

    if (basket === 'PURCHASE' || basket === 'OFFER') {
      dispatch(addToCartRegisteredDomains([domain]))
      updateRegisteredCheckoutType(cartRegisteredDomains.concat([domain]))
    }
  }

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      dispatch(clearMarketplaceDomainsCart())
    },
    onError: (error) => {
      console.error(error)
    },
  })

  const modifyCartMutation = useMutation({
    mutationFn: modifyCart,
    // onSuccess: (data) => {

    // },
    onError: (error) => {
      console.error(error)
    },
  })

  return {
    clearCart: () => clearCartMutation.mutate({ userAddress }),
    clearCartLoading: clearCartMutation.isLoading,
    modifyCart: ({ domain, inCart, basket }: ModifyCartsVariables) => {
      modifyCartLocal({ domain, inCart, basket })
      return modifyCartMutation.mutate({ domain, inCart, basket })
    },
  }
}

export default useModifyCart
