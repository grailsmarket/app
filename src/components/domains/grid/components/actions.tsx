import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import React from 'react'
import Watchlist from '@/components/ui/watchlist'
import useCartDomains from '@/hooks/useCartDomains'
import { selectUserProfile } from '@/state/reducers/profile/profile'
import { useAppSelector } from '@/state/hooks'
import { useFilterContext } from '@/contexts/FilterContext'
import CartIcon from '../../table/components/CartIcon'
import { REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'

interface ActionsProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  canAddToCart: boolean
  isFirstInRow?: boolean
}

const Actions: React.FC<ActionsProps> = ({ domain, registrationStatus, canAddToCart, isFirstInRow }) => {
  const { onSelect } = useCartDomains()
  const { filterType } = useFilterContext()
  const { selectedTab } = useAppSelector(selectUserProfile)

  if (filterType === 'portfolio') {
    if (selectedTab.value === 'domains') {
      if (domain.price) {
        return (
          <div className='flex flex-row justify-end gap-2 opacity-100 py-md'>
            <p className='text-foreground/70 hover:text-foreground text-lg cursor-pointer font-bold transition-colors'>
              Edit
            </p>
            <p className='text-foreground/70 hover:text-foreground text-lg cursor-pointer font-bold transition-colors'>
              Cancel
            </p>
          </div>
        )
      }

      return (
        <div className='flex flex-row justify-end opacity-100 py-md'>
          <p className='text-primary/80 hover:text-primary text-lg cursor-pointer font-bold transition-colors'>
            List
          </p>
        </div>
      )
    }

    if (selectedTab.value === 'received_offers') {
      return (
        <div className='flex flex-row justify-end opacity-100 py-md'>
          <p className='text-primary/80 hover:text-primary text-lg cursor-pointer font-bold transition-colors'>
            Accept Offer
          </p>
        </div>
      )
    }

    if (selectedTab.value === 'my_offers') {
      return (
        <div className='flex py-md flex-row justify-end gap-4 opacity-100'>
          <p className='text-foreground/70 hover:text-foreground text-lg cursor-pointer font-bold transition-colors'>
            Edit
          </p>
          <p className='text-foreground/70 hover:text-foreground text-lg cursor-pointer font-bold transition-colors'>
            Cancel
          </p>
        </div>
      )
    }
  }

  return (
    <div
      className='flex w-full justify-between flex-row opacity-100'
    >
      <button
        disabled={canAddToCart}
      // onClick={(e) => onCheckout(e, domain)}
      >
        {!canAddToCart && (
          <p className='text-primary/80 hover:text-primary text-lg cursor-pointer font-bold transition-colors'>
            {REGISTERABLE_STATUSES.includes(registrationStatus as string)
              ? 'Register'
              : domain.price && registrationStatus === 'Registered'
                ? 'Buy now'
                : 'Make Offer'}
          </p>
        )}
      </button>
      <div className='flex items-center lg:gap-x-2'>
        <Watchlist domain={domain} tooltipAlign={isFirstInRow ? 'left' : 'right'} />
        <button
          className='cursor-pointer rounded-sm p-1.5'
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
