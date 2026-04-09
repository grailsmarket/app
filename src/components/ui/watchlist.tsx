import React, { useCallback, useMemo, useState } from 'react'
import Image from 'next/image'
import Tooltip from './tooltip'
import _ from 'lodash'

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
import PrimaryButton from './buttons/primary'
import { useClickAway } from '@/hooks/useClickAway'
import { Cross, ShortArrow } from 'ethereum-identity-kit'

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
  fetchWatchSettings = true,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [pendingMembership, setPendingMembership] = useState<Record<number, boolean>>({})

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
    watchlistItem,
    isUpdatingSettings,
    listsContainingName,
    isInList,
    getEntryForList,
    addToList,
    removeFromList,
  } = useWatchlist(domain.name, domain.token_id, true, watchlistId)

  const { lists } = useWatchlists()
  const hasMultipleLists = lists.length > 1

  // Snapshot of server notification settings for dirty check
  const serverSettings = useMemo<WatchlistSettingsType>(
    () => ({
      notifyOnSale: watchlistItem?.notifyOnSale ?? true,
      notifyOnOffer: watchlistItem?.notifyOnOffer ?? true,
      notifyOnListing: watchlistItem?.notifyOnListing ?? true,
      notifyOnPriceChange: watchlistItem?.notifyOnPriceChange ?? true,
    }),
    [watchlistItem]
  )

  // Build the server membership state for dirty check
  const serverMembership = useMemo(() => {
    const map: Record<number, boolean> = {}
    lists.forEach((list) => {
      map[list.id] = isInList(list.id)
    })
    return map
  }, [lists, isInList])

  const hasMembershipChanges = useMemo(
    () => lists.some((list) => (pendingMembership[list.id] ?? false) !== (serverMembership[list.id] ?? false)),
    [lists, pendingMembership, serverMembership]
  )

  const isInAnyPendingList = useMemo(() => lists.some((list) => pendingMembership[list.id]), [lists, pendingMembership])

  const hasNotificationChanges = useMemo(
    () => !_.isEqual(watchlistSettings, serverSettings),
    [watchlistSettings, serverSettings]
  )

  const hasChanges = hasMembershipChanges || hasNotificationChanges

  const openDropdown = useCallback(() => {
    const initial: Record<number, boolean> = {}
    lists.forEach((list) => {
      initial[list.id] = isInList(list.id)
    })
    setPendingMembership(initial)
    setDropdownOpen(true)
  }, [lists, isInList])

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false)
  }, [])

  const togglePendingList = useCallback((listId: number) => {
    setPendingMembership((prev) => ({ ...prev, [listId]: !prev[listId] }))
  }, [])

  const toggleNotificationSetting = useCallback(
    (key: keyof WatchlistSettingsType) => {
      setWatchlistSettings({ ...watchlistSettings, [key]: !watchlistSettings[key] })
    },
    [watchlistSettings, setWatchlistSettings]
  )

  const handleSave = useCallback(() => {
    // Optimistically update the icon before mutations resolve
    const willBeInAnyList = lists.some((list) => pendingMembership[list.id])
    setIsWatching(willBeInAnyList)

    lists.forEach((list) => {
      const wasIn = serverMembership[list.id] ?? false
      const shouldBeIn = pendingMembership[list.id] ?? false

      if (shouldBeIn && !wasIn) {
        addToList(domain, list.id)
      } else if (!shouldBeIn && wasIn) {
        const entry = getEntryForList(list.id)
        if (entry) removeFromList(entry.watchlistEntryId, list.id)
      }
    })

    if (hasNotificationChanges) {
      updateWatchlistSettings(watchlistSettings)
    }

    setDropdownOpen(false)
  }, [
    lists,
    serverMembership,
    pendingMembership,
    domain,
    setIsWatching,
    addToList,
    getEntryForList,
    removeFromList,
    hasNotificationChanges,
    updateWatchlistSettings,
    watchlistSettings,
  ])

  const handleBinocularsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (authStatus !== 'authenticated') {
      if (!userAddress) openConnectModal?.()
      else handleSignIn()
      return
    }

    if (hasMultipleLists) {
      if (dropdownOpen) {
        closeDropdown()
      } else {
        openDropdown()
      }
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

      {/* Settings dropdown — shown via bell icon (single list) or binoculars click (multi list) */}
      {(showSettings && isWatching) || (hasMultipleLists && dropdownOpen) ? (
        <div
          ref={dropdownRef as React.RefObject<HTMLDivElement>}
          className='relative ml-1 flex flex-row items-center gap-2'
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bell trigger — only show when settings are enabled and we're not using binoculars as trigger */}
          {showSettings && isWatching && (
            <button
              className='bg-secondary hover:bg-tertiary flex cursor-pointer flex-row items-center gap-1 rounded-md p-1.5'
              onClick={() => {
                if (dropdownOpen) {
                  setDropdownOpen(false)
                } else {
                  openDropdown()
                }
              }}
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

          {/* Dropdown panel */}
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
              onClick={closeDropdown}
              className='text-foreground absolute top-3 right-3 h-3 w-3 cursor-pointer transition-opacity hover:opacity-80'
            />

            {/* Lists section */}
            {hasMultipleLists && (
              <>
                <p className='text-neutral p-md w-full py-1 text-lg font-semibold'>Lists</p>
                {lists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => togglePendingList(list.id)}
                    className='hover:bg-foreground/10 p-md flex w-full cursor-pointer flex-row items-center justify-between gap-2 rounded-md'
                  >
                    <p className='text-lg font-medium'>{list.name}</p>
                    <FilterSelector
                      onClick={() => togglePendingList(list.id)}
                      isActive={pendingMembership[list.id] ?? false}
                    />
                  </div>
                ))}
                {isInAnyPendingList && <div className='border-tertiary my-1 w-full border-t' />}
              </>
            )}

            {/* Notification settings — only when the name will be in at least one list */}
            {(isInAnyPendingList || (!hasMultipleLists && isWatching)) && (
              <>
                {hasMultipleLists && (
                  <p className='text-neutral p-md w-full pb-1 text-lg font-semibold'>Notifications</p>
                )}
                {(Object.keys(NOTIFICATION_LABELS) as (keyof WatchlistSettingsType)[]).map((key) => (
                  <div
                    key={key}
                    onClick={() => toggleNotificationSetting(key)}
                    className='hover:bg-foreground/10 p-md flex w-full cursor-pointer flex-row items-center justify-between gap-2 rounded-md'
                  >
                    <p className='text-lg font-medium'>{NOTIFICATION_LABELS[key]}</p>
                    <FilterSelector onClick={() => toggleNotificationSetting(key)} isActive={watchlistSettings[key]} />
                  </div>
                ))}
              </>
            )}

            <PrimaryButton
              className='mt-1 w-full'
              onClick={handleSave}
              disabled={!hasChanges || isUpdatingSettings || isLoading}
            >
              Save
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default Watchlist
