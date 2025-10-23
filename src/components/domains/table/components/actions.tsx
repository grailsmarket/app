import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import Watchlist from '@/components/ui/watchlist'
import CartIcon from './CartIcon'
import useCartDomains from '@/hooks/useCartDomains'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/context/filters'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'

interface ActionsProps {
  domain: MarketplaceDomainType
  index: number
  columnCount: number
  canAddToCart: boolean
}

const Actions: React.FC<ActionsProps> = ({ domain, index, columnCount, canAddToCart }) => {
  const { onSelect } = useCartDomains()
  const { filterType } = useFilterContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const width = ALL_MARKETPLACE_COLUMNS['actions'].getWidth(columnCount)
  const domainListing = domain.listings[0]

  if (filterType === 'portfolio') {
    if (selectedTab.value === 'domains') {
      if (domainListing?.price) {
        return (
          <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
            <SecondaryButton>
              Edit
            </SecondaryButton>
            <SecondaryButton>
              Cancel
            </SecondaryButton>
          </div>
        )
      }
      return (
        <div className={cn('flex flex-row justify-end opacity-100', width)}>
          <PrimaryButton>
            List
          </PrimaryButton>
        </div>
      )
    }

    if (selectedTab.value === 'received_offers') {
      return (
        <div className={cn('flex flex-row justify-end opacity-100', width)}>
          <PrimaryButton
            disabled={!canAddToCart}
            onClick={(e) => onSelect(e, domain)}
          >
            Accept
          </PrimaryButton>
        </div>
      )
    }

    if (selectedTab.value === 'my_offers') {
      return (
        <div className={cn('flex flex-row justify-end gap-2 opacity-100', width)}>
          <SecondaryButton>
            Edit
          </SecondaryButton>
          <SecondaryButton>
            Cancel
          </SecondaryButton>
        </div>
      )
    }
  }

  return (
    <div
      className={cn('flex flex-row justify-end opacity-100', width)}
    >
      <div className='flex items-center lg:gap-x-2'>
        <div className=''>
          <Watchlist domain={domain} tooltipPosition={index === 0 ? 'bottom' : 'top'} />
        </div>
        <button
          className={`cursor-pointer rounded-sm p-1.5`}
          disabled={!canAddToCart}
          onClick={(e) => onSelect(e, domain)}
        >
          <CartIcon name={domain.name} />
        </button>
      </div>
    </div>
  )
}

export default Actions
