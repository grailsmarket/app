'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  addUserWatchlistDomain,
  decrementWatchlistListItemCount,
  incrementWatchlistListItemCount,
  removeUserWatchlistDomain,
  selectUserProfile,
} from '../state/reducers/portfolio/profile'
import type { MarketplaceDomainType, WatchlistCheckListEntry } from '../types/domains'
import { addToWatchlist } from '@/api/watchlist/addToWatchlist'
import { removeFromWatchlist } from '@/api/watchlist/removeFromWatchlist'
import { checkWatchlist } from '@/api/watchlist/checkWatchlist'
import { useUserContext } from '@/context/user'
import { updateWatchlistSettings, WatchlistSettingsType } from '@/api/watchlist/update'
import { labelhash } from 'viem'
import { generateEmptyName } from '@/utils/generateEmptyName'

const DEFAULT_SETTINGS: WatchlistSettingsType = {
  notifyOnSale: true,
  notifyOnOffer: true,
  notifyOnListing: true,
  notifyOnPriceChange: true,
  notifyOnComment: false,
}

const useWatchlist = (name: string, tokenId: string, fetchWatchSettings = true, watchlistId?: number | null) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { watchlist, watchlistLists } = useAppSelector(selectUserProfile)
  const lists = watchlistLists ?? []
  const { userAddress, authStatus } = useUserContext()
  const [fetchWatchlistItem, setFetchWatchlistItem] = useState(fetchWatchSettings)
  const [hasWatchlistedBefore, setHasWatchlistedBefore] = useState<boolean | undefined>(undefined)
  const [watchlistCountChange, setWatchlistCountChange] = useState(0)
  const needsFetchTransition = useRef(false)
  const [watchlistSettings, setWatchlistSettings] = useState<WatchlistSettingsType>(DEFAULT_SETTINGS)

  const defaultListId = useMemo(() => lists.find((list) => list.isDefault)?.id ?? null, [lists])

  const invalidateWatchlist = () => {
    queryClient.refetchQueries({ queryKey: ['isWatchlisted', name, userAddress, fetchWatchlistItem] })
  }

  const addToWatchlistMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: ({ domain, listId }) => {
      dispatch(addUserWatchlistDomain(domain))
      if (listId) dispatch(incrementWatchlistListItemCount(listId))
      invalidateWatchlist()
    },
    onError: (error: any, variables) => {
      console.error(`Error adding ${variables.domain.name} to watchlist`, error)
      setWatchlistCountChange(watchlistCountChange - 1)
    },
  })

  const removeFromWatchlistMutation = useMutation({
    mutationFn: ({ entryId }: { entryId: number; listId?: number | null }) => removeFromWatchlist(entryId),
    onSuccess: (response, variables) => {
      if (response.success) {
        dispatch(removeUserWatchlistDomain(response.watchlistId))
        if (variables.listId) dispatch(decrementWatchlistListItemCount(variables.listId))
        if (needsFetchTransition.current) {
          setFetchWatchlistItem(true)
          needsFetchTransition.current = false
        }
        invalidateWatchlist()
      } else {
        needsFetchTransition.current = false
      }
    },
    onError: (error: any, variables) => {
      needsFetchTransition.current = false
      console.error(`Error removing watchlist item ID-${variables.entryId}`, error)
      setWatchlistCountChange(watchlistCountChange + 1)
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: updateWatchlistSettings,
    onSuccess: () => {
      invalidateWatchlist()
    },
    onError: (error: any) => {
      console.error('Error updating settings', error)
    },
  })

  const { data: watchlistCheck, isRefetching: isCheckRefetching } = useQuery({
    queryKey: ['isWatchlisted', name, userAddress, fetchWatchlistItem],
    queryFn: async () => {
      const result = await checkWatchlist(name)

      if (result.isWatching) {
        if (hasWatchlistedBefore === undefined) setHasWatchlistedBefore(true)

        const domain: MarketplaceDomainType = generateEmptyName(
          result.watchlistEntry.ensName,
          labelhash(result.watchlistEntry.ensName.replace('.eth', ''))
        )
        dispatch(addUserWatchlistDomain(domain))
      } else {
        if (hasWatchlistedBefore === undefined) setHasWatchlistedBefore(false)
        dispatch(removeUserWatchlistDomain(result.watchlistEntry?.id))
      }

      return result
    },
    enabled: !!name && !!userAddress && authStatus === 'authenticated' && !!fetchWatchlistItem,
  })

  const listsContainingName: WatchlistCheckListEntry[] = useMemo(() => watchlistCheck?.lists ?? [], [watchlistCheck])

  const isInList = useCallback(
    (listId: number) => listsContainingName.some((entry) => entry.listId === listId),
    [listsContainingName]
  )

  const getEntryForList = useCallback(
    (listId: number) => listsContainingName.find((entry) => entry.listId === listId),
    [listsContainingName]
  )

  useEffect(() => {
    if (watchlistId) {
      const watchlistItem = watchlist?.find((item) => item.id === watchlistId)

      if (watchlistItem && watchlistItem.watchlist) {
        setWatchlistSettings({
          notifyOnSale: watchlistItem.watchlist.notifyOnSale,
          notifyOnOffer: watchlistItem.watchlist.notifyOnOffer,
          notifyOnListing: watchlistItem.watchlist.notifyOnListing,
          notifyOnPriceChange: watchlistItem.watchlist.notifyOnPriceChange,
          notifyOnComment: watchlistItem.watchlist.notifyOnComment ?? false,
        })
      }

      return
    }

    // Prefer default list entry if present, otherwise fall back to the first
    const preferred = listsContainingName.find((entry) => entry.listIsDefault) ?? listsContainingName[0]

    if (preferred) {
      setWatchlistSettings({
        notifyOnSale: preferred.notifyOnSale,
        notifyOnOffer: preferred.notifyOnOffer,
        notifyOnListing: preferred.notifyOnListing,
        notifyOnPriceChange: preferred.notifyOnPriceChange,
        notifyOnComment: preferred.notifyOnComment ?? false,
      })
      return
    }

    if (watchlistCheck?.watchlistEntry) {
      setWatchlistSettings({
        notifyOnSale: watchlistCheck.watchlistEntry.notifyOnSale,
        notifyOnOffer: watchlistCheck.watchlistEntry.notifyOnOffer,
        notifyOnListing: watchlistCheck.watchlistEntry.notifyOnListing,
        notifyOnPriceChange: watchlistCheck.watchlistEntry.notifyOnPriceChange,
        notifyOnComment: watchlistCheck.watchlistEntry.notifyOnComment ?? false,
      })
    }
  }, [watchlistCheck, watchlistId, watchlist, listsContainingName])

  const serverIsWatching = useMemo(() => {
    if (watchlistId && !fetchWatchlistItem) return true
    if (listsContainingName.length > 0) return true
    return watchlist?.some((item) => item.name === name) || false
  }, [watchlistId, fetchWatchlistItem, watchlist, name, listsContainingName])

  const [isWatching, setIsWatching] = useState(serverIsWatching)

  useEffect(() => {
    if (addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending || isCheckRefetching) return
    setIsWatching(serverIsWatching)
  }, [serverIsWatching, addToWatchlistMutation.isPending, removeFromWatchlistMutation.isPending, isCheckRefetching])

  const addToList = useCallback(
    (domain: MarketplaceDomainType, listId?: number) => {
      addToWatchlistMutation.mutate({ domain, listId })
    },
    [addToWatchlistMutation]
  )

  const removeFromList = useCallback(
    (entryId: number, listId?: number | null) => {
      removeFromWatchlistMutation.mutate({ entryId, listId })
    },
    [removeFromWatchlistMutation]
  )

  const toggleInList = useCallback(
    (domain: MarketplaceDomainType, listId: number) => {
      const entry = getEntryForList(listId)
      if (entry) {
        removeFromWatchlistMutation.mutate({ entryId: entry.watchlistEntryId, listId })
      } else {
        addToWatchlistMutation.mutate({ domain, listId })
      }
    },
    [getEntryForList, removeFromWatchlistMutation, addToWatchlistMutation]
  )

  // Backward-compat: toggle membership in the default list (or the explicit `watchlistId` entry).
  const toggleWatchlist = (domain: MarketplaceDomainType) => {
    if (watchlistId && !fetchWatchlistItem) {
      setIsWatching(false)
      needsFetchTransition.current = true
      removeFromWatchlistMutation.mutate({ entryId: watchlistId })
      dispatch(removeUserWatchlistDomain(watchlistId))
      return
    }

    setIsWatching(!isWatching)
    if (!(removeFromWatchlistMutation.isPending || addToWatchlistMutation.isPending))
      setWatchlistCountChange(isWatching ? (hasWatchlistedBefore ? -1 : 0) : hasWatchlistedBefore ? 0 : 1)

    const defaultEntry = defaultListId ? getEntryForList(defaultListId) : undefined
    const fallbackEntryId =
      defaultEntry?.watchlistEntryId ||
      watchlistCheck?.watchlistEntry?.id ||
      watchlist?.find((item) => item.id === domain.id)?.watchlist_record_id

    if (isWatching && fallbackEntryId) {
      removeFromWatchlistMutation.mutate({ entryId: fallbackEntryId, listId: defaultListId })
      return
    }

    addToWatchlistMutation.mutate({ domain, listId: defaultListId ?? undefined })
  }

  const updateSettings = useCallback(
    (settings: WatchlistSettingsType) => {
      setWatchlistSettings(settings)
      if (watchlistId && !fetchWatchlistItem) {
        updateSettingsMutation.mutate({ watchlistId, settings })
      } else {
        const preferred = listsContainingName.find((entry) => entry.listIsDefault) ?? listsContainingName[0]
        const targetId = preferred?.watchlistEntryId ?? watchlistCheck?.watchlistEntry?.id

        if (targetId) {
          updateSettingsMutation.mutate({ watchlistId: targetId, settings })
        } else {
          console.error('Watchlist item not found')
        }
      }
    },
    [watchlistId, fetchWatchlistItem, watchlistCheck, listsContainingName, updateSettingsMutation]
  )

  const updateSettingsForList = useCallback(
    (listId: number, settings: WatchlistSettingsType) => {
      const entry = getEntryForList(listId)
      if (!entry) {
        console.error(`No watchlist entry for list ${listId}`)
        return
      }
      updateSettingsMutation.mutate({ watchlistId: entry.watchlistEntryId, settings })
    },
    [getEntryForList, updateSettingsMutation]
  )

  const isLoadingWatchlist = addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending

  return {
    isWatching,
    setIsWatching,
    watchlistItem: watchlistCheck?.watchlistEntry,
    toggleWatchlist,
    isLoading: isLoadingWatchlist,
    watchlistCountChange,
    watchlistSettings,
    setWatchlistSettings,
    updateWatchlistSettings: updateSettings,
    isUpdatingSettings: updateSettingsMutation.isPending,
    // Multi-list additions
    listsContainingName,
    isInList,
    getEntryForList,
    addToList,
    removeFromList,
    toggleInList,
    updateSettingsForList,
  }
}

export default useWatchlist
