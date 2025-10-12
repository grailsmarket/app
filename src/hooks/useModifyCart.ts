import { useAccount } from 'wagmi'
import { useMutation } from '@tanstack/react-query'

import { useAppDispatch, useAppSelector } from '../state/hooks'

import { clearCart } from '@/api/cart/clearCart'
import { ModifyCartsVariables, modifyCart } from '@/api/cart/modifyCart'

import {
  selectMarketplaceDomains,
  addToCartRegisteredDomains,
  clearMarketplaceDomainsCart,
  addToCartUnregisteredDomains,
  removeFromMarketplaceDomainsCart,
} from '../state/reducers/domains/marketplaceDomains'

const useModifyCart = () => {
  const dispatch = useAppDispatch()
  const { address: userAddress } = useAccount()

  const modifyCartLocal = ({ domain, inCart, basket }: ModifyCartsVariables) => {
    if (inCart) {
      dispatch(removeFromMarketplaceDomainsCart([domain.name]))
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

    if (basket === 'PURCHASE') {
      dispatch(addToCartRegisteredDomains([domain]))
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
    clearCartLoading: clearCartMutation.isPending,
    modifyCart: ({ domain, inCart, basket }: ModifyCartsVariables) => {
      modifyCartLocal({ domain, inCart, basket })
      return modifyCartMutation.mutate({ domain, inCart, basket })
    },
  }
}

export default useModifyCart
