import { useAccount } from 'wagmi'
import { useMutation } from '@tanstack/react-query'

import { useAppDispatch, useAppSelector } from '../state/hooks'

import { clearCart } from '@/api/cart/clearCart'
import { modifyCart } from '@/api/cart/modifyCart'

import {
  addModifyingCartTokenId,
  addToCartRegisteredDomains,
  clearMarketplaceDomainsCart,
  removeFromMarketplaceDomainsCart,
  removeModifyingCartTokenId,
  selectMarketplaceDomains,
  setModifyingCartTokenIds,
} from '../state/reducers/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'

interface ModifyCartsVariables {
  domain: MarketplaceDomainType
  inCart: boolean
  cartType: 'sales' | 'registrations'
}

const useModifyCart = () => {
  const dispatch = useAppDispatch()
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)
  const { address: userAddress } = useAccount()

  const clearCartMutation = useMutation({
    mutationFn: clearCart,
    onSuccess: () => {
      dispatch(clearMarketplaceDomainsCart())
      dispatch(setModifyingCartTokenIds([]))
    },
    onError: (error) => {
      console.error(error)
      dispatch(setModifyingCartTokenIds([]))
    },
  })

  const { mutate: modifyCartMutation, isPending: modifyCartLoading } = useMutation({
    mutationFn: modifyCart,
    onError: (error) => {
      console.error(error)
      dispatch(setModifyingCartTokenIds([]))
    },
    onSuccess: (data) => {
      setTimeout(() => {
        if (data.inCart) {
          dispatch(removeFromMarketplaceDomainsCart([data.cartItem.name]))
        } else {
          dispatch(addToCartRegisteredDomains([data.cartItem]))
        }
      }, 10)
    },
    onSettled: (data) => {
      if (data?.cartItem) {
        dispatch(removeModifyingCartTokenId(data.cartItem.token_id))
      }
    },
  })

  return {
    clearCart: () => {
      dispatch(
        setModifyingCartTokenIds(cartRegisteredDomains.concat(cartUnregisteredDomains).map((domain) => domain.token_id))
      )
      clearCartMutation.mutate({ userAddress })
    },
    clearCartLoading: clearCartMutation.isPending,
    modifyCart: ({ domain, inCart, cartType }: ModifyCartsVariables) => {
      dispatch(addModifyingCartTokenId(domain.token_id))
      return modifyCartMutation({ domain, inCart, cartType })
    },
    modifyCartLoading,
  }
}

export default useModifyCart
