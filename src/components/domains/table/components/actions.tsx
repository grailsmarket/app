import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React, { MouseEventHandler } from 'react'
import Watchlist from '@/components/ui/watchlist'
import CartIcon from './CartIcon'
import useCartDomains from '@/hooks/useCartDomains'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { setMakeListingModalDomain, setMakeListingModalOpen } from '@/state/reducers/modals/makeListingModal'
import { setCancelListingModalListing, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'

interface ActionsProps {
  domain: MarketplaceDomainType
  index: number
  columnCount: number
  canAddToCart: boolean
}

const Actions: React.FC<ActionsProps> = ({ domain, index, columnCount, canAddToCart }) => {
  const dispatch = useAppDispatch()
  const { onSelect } = useCartDomains()
  const { filterType } = useFilterContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const width = ALL_MARKETPLACE_COLUMNS['actions'].getWidth(columnCount)
  const domainListing = domain.listings[0]

  const openListModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(setMakeListingModalDomain(domain))
    dispatch(setMakeListingModalOpen(true))
  }

  const openCancelListingModal: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(
      setCancelListingModalListing({
        id: domainListing.id,
        name: domain.name,
        price: domainListing.price,
        currency: domainListing.currency_address,
        expires: domainListing.expires_at,
      })
    )
    dispatch(setCancelListingModalOpen(true))
  }

  if (filterType === 'portfolio') {
    if (selectedTab.value === 'domains') {
      if (domainListing?.price) {
        return (
          <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
            <SecondaryButton>Edit</SecondaryButton>
            <SecondaryButton onClick={openCancelListingModal}>Cancel</SecondaryButton>
          </div>
        )
      }
      return (
        <div className={cn('flex flex-row justify-end opacity-100', width)}>
          <PrimaryButton onClick={openListModal}>List</PrimaryButton>
        </div>
      )
    }

    if (selectedTab.value === 'received_offers') {
      return (
        <div className={cn('flex flex-row justify-end opacity-100', width)}>
          <PrimaryButton disabled={!canAddToCart} onClick={(e) => onSelect(e, domain)}>
            Accept
          </PrimaryButton>
        </div>
      )
    }

    if (selectedTab.value === 'my_offers') {
      return (
        <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
          <SecondaryButton>Edit</SecondaryButton>
          <SecondaryButton>Cancel</SecondaryButton>
        </div>
      )
    }
  }

  return (
    <div className={cn('flex flex-row justify-end opacity-100', width)}>
      <div className='flex items-center lg:gap-x-2'>
        <div className=''>
          <Watchlist domain={domain} tooltipPosition={index === 0 ? 'bottom' : 'top'} />
        </div>
        <button
          className={`cursor-pointer rounded-sm p-1.5`}
          disabled={!canAddToCart}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onSelect(e, domain)
          }}
        >
          <CartIcon domain={domain} />
        </button>
      </div>
    </div>
  )
}

export default Actions
