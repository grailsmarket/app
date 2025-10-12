import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import Watchlist from '@/components/ui/watchlist'
import CartIcon from './CartIcon'
import useCartDomains from '@/hooks/useCartDomains'

interface ActionsProps {
  domain: MarketplaceDomainType
  index: number
  columnCount: number
  canAddToCart: boolean
}

const Actions: React.FC<ActionsProps> = ({ domain, index, columnCount, canAddToCart }) => {
  const { onSelect, isAddedToCart } = useCartDomains()

  return (
    <div className={cn('flex flex-row justify-end', ALL_MARKETPLACE_COLUMNS['actions'].getWidth(columnCount))}>
      <div className="flex items-center lg:gap-x-3">
        <div className="hidden lg:block">
          <Watchlist
            domain={domain}
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
          />
        </div>
        <button
          className={`rounded-sm p-1.5 ${isAddedToCart(domain.name)
            ? 'opacity-100'
            : canAddToCart
              ? 'opacity-100 group-hover:opacity-100 lg:opacity-0'
              : 'opacity-0'
            }`}
          disabled={canAddToCart}
          onClick={(e) => onSelect(e, domain)}
        >
          <CartIcon name={domain.name} />
        </button>
      </div>
    </div>
  )
}

export default Actions
