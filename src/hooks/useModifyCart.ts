import { useAccount } from 'wagmi'
import { useMutation } from '@tanstack/react-query'

import { useAppDispatch, useAppSelector } from '../state/hooks'

import { clearCart } from '@/api/cart/clearCart'
import { modifyCart } from '@/api/cart/modifyCart'

import {
  addToCartRegisteredDomains,
  clearMarketplaceDomainsCart,
  removeFromMarketplaceDomainsCart,
  selectMarketplaceDomains,
  setModifyingCartTokenIds,
  toggleModifyingCart,
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

  const { mutate: modifyCartMutation } = useMutation({
    mutationFn: modifyCart,
    onError: (error) => {
      console.error(error)
      dispatch(setModifyingCartTokenIds([]))
    },
    onSuccess: (data) => {
      if (data.inCart) {
        dispatch(removeFromMarketplaceDomainsCart([data.cartItem.name]))
      } else {
        dispatch(addToCartRegisteredDomains([data.cartItem]))
      }
    },
    onSettled: (data) => {
      if (data?.cartItem) {
        dispatch(toggleModifyingCart({ isModifying: false, tokenId: data.cartItem.token_id }))
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
      dispatch(toggleModifyingCart({ isModifying: true, tokenId: domain.token_id }))
      return modifyCartMutation({ domain, inCart, cartType })
    },
  }
}

export default useModifyCart
