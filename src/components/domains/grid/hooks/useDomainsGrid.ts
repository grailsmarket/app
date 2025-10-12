import { MouseEvent } from 'react'
import { useAppDispatch } from '@/state/hooks'
import { setQuickOfferModalDomain, setQuickOfferModalOpen } from '@/state/reducers/modals/quickOfferModal'
import { MarketplaceDomainType } from '@/types/domains'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import { REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import useETHPrice from '@/hooks/useETHPrice'
import useSufficientBalance from '@/hooks/useSufficientBalance'

const useDomainsGrid = () => {
  const dispatch = useAppDispatch()
  const { ethPrice } = useETHPrice()
  const { calculateIsSufficientEthBalance } = useSufficientBalance()

  const onCheckout = (e: MouseEvent, domain: MarketplaceDomainType) => {
    e.stopPropagation()

    const checkoutType = REGISTERABLE_STATUSES.includes(getRegistrationStatus(domain.expiry_date) as string)
      ? 'Registration'
      : !domain.price && getRegistrationStatus(domain.expiry_date) === 'Registered'
        ? 'Offer'
        : 'Purchase'

    if (checkoutType === 'Offer') {
      dispatch(setQuickOfferModalOpen(true))
      dispatch(setQuickOfferModalDomain(domain))
      return
    }

    if (checkoutType === 'Registration') {
      const isBalanceSufficient = calculateIsSufficientEthBalance(
        (Number(domain.price) || calculateRegistrationPrice(domain.name).usd) / Number(ethPrice || 1)
      )
      if (!isBalanceSufficient) return

      // checkout(checkoutType as MarketplaceCheckoutType, [{ ...domain, registrationPeriod: 1 }])
      return
    }

    if (!domain.price) return

    const isBalanceSufficient = calculateIsSufficientEthBalance(domain.price, true)
    if (!isBalanceSufficient) return

    // checkout(checkoutType as MarketplaceCheckoutType, [domain])
  }

  return {
    onCheckout,
  }
}

export default useDomainsGrid
