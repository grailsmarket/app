import React from 'react'
import Image from 'next/image'
import Tooltip from './tooltip'
import BinocularsEmpty from 'public/icons/watchlist.svg'
import BinocularsFilled from 'public/icons/watchlist-fill.svg'
import { TooltipAlignType, TooltipPositionType } from '@/types/ui'
import { MarketplaceDomainType } from '@/types/domains'
import useWatchlist from '@/hooks/useWatchlist'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'

interface WatchlistProps {
  domain: MarketplaceDomainType
  tooltipPosition?: TooltipPositionType
  showWatchlist?: boolean
  tooltipAlign?: TooltipAlignType
}

const Watchlist: React.FC<WatchlistProps> = ({ domain, showWatchlist = true, tooltipPosition, tooltipAlign }) => {
  const { authStatus, handleSignIn, userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const { watchlistNames, toggleWatchlist, isLoading } = useWatchlist()
  const isWatchlisted = watchlistNames?.includes(domain.name) || isLoading

  return (
    <Tooltip
      label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
      position={tooltipPosition || 'top'}
      align={tooltipAlign || 'right'}
      showOnMobile
    >
      <button
        className={cn('cursor-pointer', showWatchlist ? 'block' : 'hidden')}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (authStatus !== 'authenticated') {
            if (!userAddress) openConnectModal?.()
            else handleSignIn()
          } else toggleWatchlist(domain)
        }}
      >
        <Image
          src={isWatchlisted ? BinocularsFilled : BinocularsEmpty}
          height={22}
          width={22}
          alt='Like heart'
          className={cn(
            isWatchlisted || isLoading ? 'opacity-100 hover:opacity-80' : 'opacity-70 hover:opacity-100',
            'transition-opacity'
          )}
        />
      </button>
    </Tooltip>
  )
}

export default Watchlist
