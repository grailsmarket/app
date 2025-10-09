import { MouseEvent } from 'react'
import { useAppDispatch } from '@/app/state/hooks'
import useSufficientBalance from '@/app/hooks/useSufficientBalance'
import useETHPrice from '@/app/ui/Footer/components/ETHPrice/hooks/useETHPrice'
import useCheckout from '@/app/hooks/useCheckout'
import {
  setQuickOfferModalDomain,
  setQuickOfferModalOpen,
} from '@/app/state/reducers/modals/quickOfferModal'
import { MarketplaceDomainType } from '@/app/types/domains'
import { getRegistrationStatus } from '@/app/utils/getRegistrationStatus'
import { calculateRegistrationPrice } from '../../../utils/calculateRegistrationPrice'
import { MarketplaceCheckoutType } from '@/app/state/reducers/domains/marketplaceDomains'
import { REGISTERABLE_STATUSES } from '@/app/constants/domains/registrationStatuses'

const useDomainsGrid = () => {
  const dispatch = useAppDispatch()
  const { ethPrice } = useETHPrice()
  const { checkout } = useCheckout()
  const { calculateIsSufficientEthBalance } = useSufficientBalance()

  const onCheckout = (e: MouseEvent, domain: MarketplaceDomainType) => {
    e.stopPropagation()

    const checkoutType = REGISTERABLE_STATUSES.includes(
      getRegistrationStatus(domain.expire_time) as string,
    )
      ? 'Registration'
      : !domain.listing_price &&
        getRegistrationStatus(domain.expire_time) === 'Registered'
      ? 'Offer'
      : 'Purchase'

    if (checkoutType === 'Offer') {
      dispatch(setQuickOfferModalOpen(true))
      dispatch(setQuickOfferModalDomain(domain))
      return
    }

    if (checkoutType === 'Registration') {
      const isBalanceSufficient = calculateIsSufficientEthBalance(
        (domain.registration_price ||
          calculateRegistrationPrice(domain.name).usd) / Number(ethPrice || 1),
      )
      if (!isBalanceSufficient) return

      checkout(checkoutType as MarketplaceCheckoutType, [
        { ...domain, registrationPeriod: 1 },
      ])
      return
    }

    if (!domain.listing_price) return

    const isBalanceSufficient = calculateIsSufficientEthBalance(
      domain.listing_price,
      true,
    )
    if (!isBalanceSufficient) return

    checkout(checkoutType as MarketplaceCheckoutType, [domain])
  }

  return {
    onCheckout,
  }
}

export default useDomainsGrid
