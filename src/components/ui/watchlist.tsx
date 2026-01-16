import React, { useState } from 'react'
import Image from 'next/image'
import Tooltip from './tooltip'
import _ from 'lodash'

import BinocularsEmpty from 'public/icons/watchlist.svg'
import BinocularsFilled from 'public/icons/watchlist-fill.svg'
import { TooltipAlignType, TooltipPositionType } from '@/types/ui'
import { MarketplaceDomainType } from '@/types/domains'
import useWatchlist from '@/hooks/useWatchlist'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import BellIcon from 'public/icons/bell.svg'
import FilterSelector from '../filters/components/FilterSelector'
import { WatchlistSettingsType } from '@/api/watchlist/update'
import PrimaryButton from './buttons/primary'
import { useClickAway } from '@/hooks/useClickAway'
import { ShortArrow } from 'ethereum-identity-kit'

interface WatchlistProps {
  domain: MarketplaceDomainType
  includeCount?: boolean
  tooltipPosition?: TooltipPositionType
  showWatchlist?: boolean
  tooltipAlign?: TooltipAlignType
  iconSize?: number
  iconClassName?: string
  showSettings?: boolean
  dropdownPosition?: 'right' | 'left'
  watchlistId?: number | undefined
  showSettingsArrow?: boolean
}

const watchlistSettingsLabels: Record<keyof WatchlistSettingsType, string> = {
  notifyOnSale: 'Notify on sale',
  notifyOnOffer: 'Notify on offer',
  notifyOnListing: 'Notify on listing',
  notifyOnPriceChange: 'Notify on price change',
}

const Watchlist: React.FC<WatchlistProps> = ({
  domain,
  includeCount = false,
  showWatchlist = true,
  tooltipPosition,
  tooltipAlign,
  iconSize,
  iconClassName,
  showSettings = false,
  dropdownPosition = 'right',
  watchlistId,
  showSettingsArrow = true,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const outsideSettingsRef = useClickAway(() => setSettingsOpen(false))
  const { openConnectModal } = useConnectModal()
  const { authStatus, handleSignIn, userAddress } = useUserContext()
  const {
    toggleWatchlist,
    isLoading,
    isWatching,
    watchlistCountChange,
    watchlistSettings,
    setWatchlistSettings,
    updateWatchlistSettings,
    watchlistItem,
    isUpdatingSettings,
  } = useWatchlist(domain.name, domain.token_id, watchlistId)

  const currentSettings = {
    notifyOnSale: watchlistItem?.notifyOnSale,
    notifyOnOffer: watchlistItem?.notifyOnOffer,
    notifyOnListing: watchlistItem?.notifyOnListing,
    notifyOnPriceChange: watchlistItem?.notifyOnPriceChange,
  } as WatchlistSettingsType

  return (
    <>
      <Tooltip
        label={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
        position={tooltipPosition || 'top'}
        align={tooltipAlign || 'right'}
        showOnMobile
      >
        <div className='flex min-w-[22px] flex-row items-center gap-2'>
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
      {showSettings && isWatching && (
        <div
          ref={outsideSettingsRef as React.RefObject<HTMLDivElement>}
          className='relative ml-1 flex flex-row items-center gap-2'
        >
          <button
            className='bg-secondary hover:bg-tertiary flex cursor-pointer flex-row items-center gap-1 rounded-md p-1.5'
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            <Image src={BellIcon} alt='Settings' width={22} height={22} className='h-5 w-5 opacity-100' />
            {showSettingsArrow && (
              <ShortArrow
                className={cn(
                  'h-4 w-4 transition-transform',
                  settingsOpen ? 'rotate-0' : 'rotate-180',
                  watchlistId ? 'hidden sm:block' : 'block'
                )}
              />
            )}
          </button>
          <div
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className={cn(
              'bg-secondary border-tertiary p-md absolute top-10 z-50 flex w-64 flex-col items-center rounded-md border shadow-md',
              dropdownPosition === 'right' ? 'left-0' : 'right-0',
              settingsOpen ? 'flex' : 'hidden'
            )}
          >
            {Object.keys(watchlistSettings).map((key) => (
              <div
                onClick={() => {
                  setWatchlistSettings({
                    ...watchlistSettings,
                    [key as keyof WatchlistSettingsType]: !watchlistSettings[key as keyof WatchlistSettingsType],
                  })
                }}
                key={key}
                className='hover:bg-foreground/10 p-md flex w-full cursor-pointer flex-row items-center justify-between gap-2 rounded-md'
              >
                <p className='text-lg font-medium'>{watchlistSettingsLabels[key as keyof WatchlistSettingsType]}</p>
                <FilterSelector
                  onClick={() => {
                    setWatchlistSettings({
                      ...watchlistSettings,
                      [key as keyof WatchlistSettingsType]: !watchlistSettings[key as keyof WatchlistSettingsType],
                    })
                  }}
                  isActive={watchlistSettings[key as keyof WatchlistSettingsType]}
                />
              </div>
            ))}
            <PrimaryButton
              className='mt-1 w-full'
              onClick={() => {
                updateWatchlistSettings(watchlistSettings)
                setSettingsOpen(false)
              }}
              disabled={_.isEqual(watchlistSettings, currentSettings) || isUpdatingSettings}
            >
              Save
            </PrimaryButton>
          </div>
        </div>
      )}
    </>
  )
}

export default Watchlist
