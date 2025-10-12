import React, { useState } from 'react'
import Image from 'next/image'

import useCartDomains from '@/hooks/useCartDomains'

import Tooltip from './tooltip'
import BinocularsEmpty from 'public/icons/watchlist.svg'
import BinocularsFilled from 'public/icons/watchlist-fill.svg'

import { TooltipPositionType } from '@/types/ui'
import { MarketplaceDomainType } from '@/types/domains'
import { MarketplaceDomainNameType } from '@/state/reducers/domains/marketplaceDomains'
import { useAuth } from '@/hooks/useAuthStatus'
import useWatchlist from '@/hooks/useWatchlist'
import { cn } from '@/utils/tailwind'

interface LikeProps {
  domain: MarketplaceDomainType
  tooltipPosition?: TooltipPositionType
  likeIsShown?: boolean
}

const Like: React.FC<LikeProps> = ({
  domain,
  likeIsShown,
  tooltipPosition,
}) => {
  const [showErrorTooltip, setShowErrorTooltip] = useState(false)

  const { isAddedToCart } = useCartDomains()
  const { authStatus } = useAuth()
  const {
    watchlistNames,
    toggleWatchlist,
    isLoading: isToggleLikeLoading,
  } = useWatchlist()

  const showLike = (name: MarketplaceDomainNameType) => {
    return (
      isAddedToCart(name) ||
      watchlistNames?.includes(name)
    )
  }

  return (
    <Tooltip
      label="Connect a wallet"
      position={tooltipPosition || 'top'}
      showTooltip={showErrorTooltip}
      showOnMobile
    >
      <button
        className={`  ${likeIsShown || showLike(domain.name)
          ? 'block'
          : 'hidden group-hover:block'
          }`}
        onClick={(e) => {
          e.stopPropagation()
          if (authStatus !== 'authenticated') {
            setShowErrorTooltip(true)
            setTimeout(() => {
              setShowErrorTooltip(false)
            }, 2000)
          }
          toggleWatchlist(domain)
        }}
      >
        <Image
          src={
            (watchlistNames?.includes(domain.name) || isToggleLikeLoading) &&
              !showErrorTooltip
              ? BinocularsFilled
              : BinocularsEmpty
          }
          height={20}
          width={20}
          alt="Like heart"
          className={cn(isToggleLikeLoading ? 'opacity-50' : 'opacity-100')}
        />
      </button>
    </Tooltip>
  )
}

export default Like
