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
  includeCount?: boolean
  tooltipPosition?: TooltipPositionType
  showWatchlist?: boolean
  tooltipAlign?: TooltipAlignType
  iconSize?: number
  iconClassName?: string
}

const Watchlist: React.FC<WatchlistProps> = ({
  domain,
  includeCount = false,
  showWatchlist = true,
  tooltipPosition,
  tooltipAlign,
  iconSize,
  iconClassName,
}) => {
  const { authStatus, handleSignIn, userAddress } = useUserContext()
  const { openConnectModal } = useConnectModal()
  const { toggleWatchlist, isLoading, isWatching, watchlistCountChange } = useWatchlist(domain.name, domain.token_id)

  return (
    <Tooltip
      label={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
      position={tooltipPosition || 'top'}
      align={tooltipAlign || 'right'}
      showOnMobile
    >
      <div className='flex flex-row items-center gap-2'>
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
            src={isWatching ? BinocularsFilled : BinocularsEmpty}
            height={iconSize || 22}
            width={iconSize || 22}
            alt='Like heart'
            className={cn(
              isWatching || isLoading ? 'opacity-100 hover:opacity-80' : 'opacity-70 hover:opacity-100',
              'transition-opacity',
              iconClassName
            )}
          />
        </button>
        {includeCount && <p className='text-xl'>{domain.watchers_count + watchlistCountChange}</p>}
      </div>
    </Tooltip>
  )
}

export default Watchlist
