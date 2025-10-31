import { MouseEvent } from 'react'
import { useAppDispatch } from '@/state/hooks'
import { MarketplaceDomainType } from '@/types/domains'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import useSufficientBalance from '@/hooks/useSufficientBalance'
import { setMakeOfferModalDomain, setMakeOfferModalOpen } from '@/state/reducers/modals/makeOfferModal'
import { setBuyNowModalDomain, setBuyNowModalListing, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'

const useDomainsGrid = () => {
  const dispatch = useAppDispatch()
  const { calculateIsSufficientEthBalance } = useSufficientBalance()

  const onCheckout = (e: MouseEvent, domain: MarketplaceDomainType) => {
    e.stopPropagation()

    const checkoutType = REGISTERABLE_STATUSES.includes(getRegistrationStatus(domain.expiry_date) as string)
      ? 'Registration'
      : !domain.listings && getRegistrationStatus(domain.expiry_date) === 'Registered'
        ? 'Offer'
        : 'Purchase'

    if (checkoutType === 'Offer') {
      dispatch(setMakeOfferModalOpen(true))
      dispatch(setMakeOfferModalDomain(domain))
      return
    }

    if (checkoutType === 'Registration') {
      window.open(`https://app.ens.domains/${domain.name}/register`, '_blank')
      return
    }

    if (!domain.listings[0].price) return

    const isBalanceSufficient = calculateIsSufficientEthBalance(domain.listings[0].price, true)
    if (!isBalanceSufficient) return

    dispatch(setBuyNowModalOpen(true))
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(domain.listings[0]))
  }

  return {
    onCheckout,
  }
}

export default useDomainsGrid
