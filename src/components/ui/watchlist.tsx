import React, { useCallback, useState } from 'react'
import Image from 'next/image'
import Tooltip from './tooltip'

import BinocularsEmpty from 'public/icons/watchlist.svg'
import BinocularsFilled from 'public/icons/watchlist-fill.svg'
import { TooltipAlignType, TooltipPositionType } from '@/types/ui'
import { MarketplaceDomainType } from '@/types/domains'
import useWatchlist from '@/hooks/useWatchlist'
import useWatchlists from '@/hooks/useWatchlists'
import { cn } from '@/utils/tailwind'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useUserContext } from '@/context/user'
import BellIcon from 'public/icons/bell.svg'
import FilterSelector from '../filters/components/FilterSelector'
import { WatchlistSettingsType } from '@/api/watchlist/update'
import { useClickAway } from '@/hooks/useClickAway'
import { Cross, ShortArrow } from 'ethereum-identity-kit'
import { track } from '@/lib/analytics'

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
  watchlistId?: number | null
  showSettingsArrow?: boolean
  fetchWatchSettings?: boolean
}

const NOTIFICATION_LABELS: Record<keyof WatchlistSettingsType, string> = {
  notifyOnSale: 'Notify on sale',
  notifyOnOffer: 'Notify on offer',
  notifyOnListing: 'Notify on listing',
  notifyOnPriceChange: 'Notify on price change',
  notifyOnComment: 'Notify on comment',
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
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const dropdownRef = useClickAway(() => setDropdownOpen(false))
  const { openConnectModal } = useConnectModal()
  const { authStatus, handleSignIn, userAddress } = useUserContext()

  const {
    toggleWatchlist,
    isLoading,
    isWatching,
    setIsWatching,
    watchlistCountChange,
    watchlistSettings,
    setWatchlistSettings,
    updateWatchlistSettings,
    listsContainingName,
    isInList,
    toggleInList,
  } = useWatchlist(domain.name, domain.token_id, false, watchlistId)

  const { lists } = useWatchlists()
  const hasMultipleLists = lists.length > 1
  const isInAnyList = listsContainingName.length > 0

  const handleToggleList = useCallback(
    (listId: number) => {
      const currentlyIn = isInList(listId)
      toggleInList(domain, listId)

      if (!currentlyIn) {
        setIsWatching(true)
      } else {
        const stillInOther = listsContainingName.some((entry) => entry.listId !== listId)
        setIsWatching(stillInOther)
      }
    },
    [domain, isInList, toggleInList, setIsWatching, listsContainingName]
  )

  const handleToggleNotification = useCallback(
    (key: keyof WatchlistSettingsType) => {
      const updated = { ...watchlistSettings, [key]: !watchlistSettings[key] }
      setWatchlistSettings(updated)
      updateWatchlistSettings(updated)
    },
    [watchlistSettings, setWatchlistSettings, updateWatchlistSettings]
  )

  const handleBinocularsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (authStatus !== 'authenticated') {
      if (!userAddress) openConnectModal?.()
      else handleSignIn()
      return
    } else {
      track('watchlist_toggled', {
        name: domain.name,
        action: isWatching ? 'remove' : 'add',
      })
      toggleWatchlist(domain)
    }

    if (hasMultipleLists) {
      setDropdownOpen(!dropdownOpen)
    } else {
      toggleWatchlist(domain)
    }
  }

  return (
    <>
      <Tooltip
        label={isWatching ? 'Remove from watchlist' : 'Add to watchlist'}
        position={tooltipPosition || 'top'}
        align={tooltipAlign || 'right'}
      >
        <div className='flex min-w-[22px] flex-row items-center gap-2'>
          <button className={cn('cursor-pointer', showWatchlist ? 'block' : 'hidden')} onClick={handleBinocularsClick}>
            <Image
              src={isWatching ? BinocularsFilled : BinocularsEmpty}
              height={iconSize || 22}
              width={iconSize || 22}
              alt='Watchlist'
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

      {(showSettings && isWatching) || (hasMultipleLists && dropdownOpen) ? (
        <div
          ref={dropdownRef as React.RefObject<HTMLDivElement>}
          className='relative ml-1 flex flex-row items-center gap-2'
          onClick={(e) => e.stopPropagation()}
        >
          {showSettings && isWatching && (
            <button
              className='bg-secondary hover:bg-tertiary flex cursor-pointer flex-row items-center gap-1 rounded-md p-1.5'
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <Image src={BellIcon} alt='Settings' width={22} height={22} className='min-h-5 min-w-5 opacity-100' />
              {showSettingsArrow && (
                <ShortArrow
                  className={cn(
                    'h-4 w-4 transition-transform',
                    dropdownOpen ? 'rotate-0' : 'rotate-180',
                    watchlistId ? 'hidden' : 'block'
                  )}
                />
              )}
            </button>
          )}

          <div
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className={cn(
              'bg-secondary border-tertiary p-md absolute top-4 z-50 flex w-64 flex-col items-center rounded-md border shadow-md',
              dropdownPosition === 'right' ? 'left-0' : 'right-0',
              dropdownOpen ? 'flex' : 'hidden'
            )}
          >
            <Cross
              onClick={() => setDropdownOpen(false)}
              className='text-foreground absolute top-3 right-3 h-3 w-3 cursor-pointer transition-opacity hover:opacity-80'
            />

            {hasMultipleLists && (
              <>
                <p className='text-neutral p-md w-full py-1 text-lg font-semibold'>Lists</p>
                {lists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => handleToggleList(list.id)}
                    className='hover:bg-foreground/10 p-md flex w-full cursor-pointer flex-row items-center justify-between gap-2 rounded-md'
                  >
                    <p className='text-lg font-medium'>{list.name}</p>
                    <FilterSelector onClick={() => handleToggleList(list.id)} isActive={isInList(list.id)} />
                  </div>
                ))}
                {isInAnyList && <div className='border-tertiary my-1 w-full border-t' />}
              </>
            )}

            {(isInAnyList || (!hasMultipleLists && isWatching)) && (
              <>
                {hasMultipleLists && (
                  <p className='text-neutral p-md w-full pb-1 text-lg font-semibold'>Notifications</p>
                )}
                {(Object.keys(NOTIFICATION_LABELS) as (keyof WatchlistSettingsType)[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => handleToggleNotification(key)}
                    className='hover:bg-foreground/10 p-md flex w-full cursor-pointer flex-row items-center justify-between gap-2 rounded-md'
                  >
                    <p className='text-lg font-medium'>{NOTIFICATION_LABELS[key]}</p>
                    <FilterSelector onClick={() => handleToggleNotification(key)} isActive={watchlistSettings[key]} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Watchlist
