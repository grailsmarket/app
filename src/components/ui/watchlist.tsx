import React from 'react'
import Image from 'next/image'
import Tooltip from './tooltip'
import BinocularsEmpty from 'public/icons/watchlist.svg'
import BinocularsFilled from 'public/icons/watchlist-fill.svg'
import { TooltipPositionType } from '@/types/ui'
import { MarketplaceDomainType } from '@/types/domains'
import useWatchlist from '@/hooks/useWatchlist'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user-context'

interface LikeProps {
  domain: MarketplaceDomainType
  tooltipPosition?: TooltipPositionType
  showWatchlist?: boolean
}

const Like: React.FC<LikeProps> = ({ domain, showWatchlist = true, tooltipPosition }) => {
  const { authStatus, handleSignIn, userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const { watchlistNames, toggleWatchlist, isLoading } = useWatchlist()
  const isWatchlisted = watchlistNames?.includes(domain.name)

  return (
    <Tooltip
      label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
      position={tooltipPosition || 'top'}
      showOnMobile
    >
      <button
        className={cn('cursor-pointer', showWatchlist ? 'block' : 'hidden')}
        onClick={(e) => {
          e.stopPropagation()
          if (authStatus !== 'authenticated') {
            if (!userAddress) openConnectModal?.()
            else handleSignIn()
          } else toggleWatchlist(domain)
        }}
      >
        <Image
          src={watchlistNames?.includes(domain.name) || isLoading ? BinocularsFilled : BinocularsEmpty}
          height={22}
          width={22}
          alt='Like heart'
          className={cn(
            watchlistNames?.includes(domain.name) || isLoading
              ? 'opacity-100 hover:opacity-80'
              : 'opacity-70 hover:opacity-100',
            'transition-opacity'
          )}
        />
      </button>
    </Tooltip>
  )
}

export default Like
