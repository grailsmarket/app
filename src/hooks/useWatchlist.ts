'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  addUserPendingWatchlistDomain,
  addUserWatchlistDomain,
  removeUserPendingWatchlistDomain,
  removeUserWatchlistDomain,
  selectUserProfile,
} from '../state/reducers/portfolio/profile'
import type { MarketplaceDomainType } from '../types/domains'
import { addToWatchlist } from '@/api/watchlist/addToWatchlist'
import { removeFromWatchlist } from '@/api/watchlist/removeFromWatchlist'
import { checkWatchlist } from '@/api/watchlist/checkWatchlist'
import { useUserContext } from '@/context/user'
import { updateWatchlistSettings, WatchlistSettingsType } from '@/api/watchlist/update'
import { labelhash } from 'viem'

const useWatchlist = (name: string, tokenId: string, fetchWatchSettings = true, watchlistId?: number | null) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { watchlist, pendingWatchlistTokenIds } = useAppSelector(selectUserProfile)
  const { userAddress, authStatus } = useUserContext()
  const [fetchWatchlistItem, setFetchWatchlistItem] = useState(fetchWatchSettings)
  const [hasWatchlistedBefore, setHasWatchlistedBefore] = useState<boolean | undefined>(undefined)
  const [watchlistCountChange, setWatchlistCountChange] = useState(0)
  const [watchlistSettings, setWatchlistSettings] = useState<WatchlistSettingsType>({
    notifyOnSale: true,
    notifyOnOffer: true,
    notifyOnListing: true,
    notifyOnPriceChange: true,
  })

  const invalidateWatchlist = () => {
    queryClient.refetchQueries({ queryKey: ['isWatchlisted', name, userAddress, fetchWatchlistItem] })
  }

  const addToWatchlistMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: ({ domain, response }) => {
      if (response) {
        dispatch(addUserWatchlistDomain(domain))
        invalidateWatchlist()
      }
    },
    onError: (error: any, domain) => {
      console.error(`Error adding ${domain.name} to watchlist`, error)
      setWatchlistCountChange(watchlistCountChange - 1)
    },
    onSettled: () => {
      dispatch(removeUserPendingWatchlistDomain(tokenId))
    },
  })

  const removeFromWatchlistMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: (response) => {
      if (response.success) {
        dispatch(removeUserWatchlistDomain(response.watchlistId))
        dispatch(removeUserPendingWatchlistDomain(tokenId))
        invalidateWatchlist()
      }
    },
    onError: (error: any, watchlistId) => {
      dispatch(removeUserPendingWatchlistDomain(tokenId))
      console.error(`Error removing watchlist item ID-${watchlistId}`, error)
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

  const { data: watchlistItem } = useQuery({
    queryKey: ['isWatchlisted', name, userAddress, fetchWatchlistItem],
    queryFn: async () => {
      const result = await checkWatchlist(name)

      if (result.isWatching) {
        if (hasWatchlistedBefore === undefined) setHasWatchlistedBefore(true)

        const domain: MarketplaceDomainType = {
          id: result.watchlistEntry.ensNameId,
          watchlist_record_id: result.watchlistEntry.id,
          name: result.watchlistEntry.ensName,
          token_id: labelhash(result.watchlistEntry.ensName.replace('.eth', '')),
          expiry_date: null,
          registration_date: null,
          owner: null,
          metadata: {},
          has_numbers: false,
          has_emoji: false,
          listings: [],
          clubs: [],
          highest_offer_currency: null,
          highest_offer_id: null,
          highest_offer_wei: null,
          offer: null,
          last_sale_price: null,
          last_sale_currency: null,
          last_sale_date: null,
          last_sale_price_usd: null,
          view_count: 0,
          downvotes: 0,
          upvotes: 0,
          watchers_count: 0,
        }

        dispatch(addUserWatchlistDomain(domain))
      } else {
        if (hasWatchlistedBefore === undefined) setHasWatchlistedBefore(false)
        dispatch(removeUserWatchlistDomain(result.watchlistEntry?.id))
      }

      return result
    },
    enabled: !!name && !!userAddress && authStatus === 'authenticated' && !!fetchWatchlistItem,
  })

  useEffect(() => {
    if (watchlistId) {
      const watchlistItem = watchlist?.find((item) => item.id === watchlistId)

      if (watchlistItem && watchlistItem.watchlist) {
        setWatchlistSettings({
          notifyOnSale: watchlistItem.watchlist.notifyOnSale,
          notifyOnOffer: watchlistItem.watchlist.notifyOnOffer,
          notifyOnListing: watchlistItem.watchlist.notifyOnListing,
          notifyOnPriceChange: watchlistItem.watchlist.notifyOnPriceChange,
        })
      }

      return
    }

    if (watchlistItem?.watchlistEntry) {
      setWatchlistSettings({
        notifyOnSale: watchlistItem.watchlistEntry.notifyOnSale,
        notifyOnOffer: watchlistItem.watchlistEntry.notifyOnOffer,
        notifyOnListing: watchlistItem.watchlistEntry.notifyOnListing,
        notifyOnPriceChange: watchlistItem.watchlistEntry.notifyOnPriceChange,
      })
    }
  }, [watchlistItem, watchlistId, watchlist])

  const isWatching = useMemo(() => {
    if (watchlistId && !fetchWatchlistItem) {
      return true
    }

    if (pendingWatchlistTokenIds?.includes(tokenId) || removeFromWatchlistMutation.isPending) {
      if (watchlist.some((item) => item.name === name) || removeFromWatchlistMutation.isPending) {
        return false
      }

      return true
    }

    return watchlistItem?.watchlistEntry?.ensName === name || watchlist?.some((item) => item.name === name)
  }, [
    watchlist,
    name,
    tokenId,
    pendingWatchlistTokenIds,
    removeFromWatchlistMutation.isPending,
    watchlistId,
    fetchWatchlistItem,
    watchlistItem,
  ])

  const toggleWatchlist = (domain: MarketplaceDomainType) => {
    if (watchlistId && !fetchWatchlistItem) {
      removeFromWatchlistMutation.mutate(watchlistId)
      dispatch(removeUserWatchlistDomain(watchlistId))

      setFetchWatchlistItem(true)
      return
    }

    dispatch(addUserPendingWatchlistDomain(domain.token_id))
    if (
      !(
        pendingWatchlistTokenIds?.includes(tokenId) ||
        removeFromWatchlistMutation.isPending ||
        addToWatchlistMutation.isPending
      )
    )
      setWatchlistCountChange(isWatching ? (hasWatchlistedBefore ? -1 : 0) : hasWatchlistedBefore ? 0 : 1)

    const watchlistItemId =
      watchlistItem?.watchlistEntry?.id || watchlist?.find((item) => item.id === domain.id)?.watchlist_record_id

    if (isWatching && watchlistItemId) {
      removeFromWatchlistMutation.mutate(watchlistItemId)
      return
    }

    addToWatchlistMutation.mutate(domain)
  }

  const updateSettings = useCallback(
    (settings: WatchlistSettingsType) => {
      setWatchlistSettings(settings)
      if (watchlistId && !fetchWatchlistItem) {
        updateSettingsMutation.mutate({ watchlistId, settings })
      } else if (watchlistItem?.watchlistEntry?.id) {
        updateSettingsMutation.mutate({ watchlistId: watchlistItem?.watchlistEntry?.id, settings })
      } else {
        console.error('Watchlist item not found')
      }
    },
    [watchlistId, fetchWatchlistItem, watchlistItem, updateSettingsMutation]
  )

  const isLoadingWatchlist = addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending

  return {
    isWatching,
    watchlistItem: watchlistItem?.watchlistEntry,
    toggleWatchlist,
    isLoading: isLoadingWatchlist,
    watchlistCountChange,
    watchlistSettings,
    setWatchlistSettings,
    updateWatchlistSettings: updateSettings,
    isUpdatingSettings: updateSettingsMutation.isPending,
  }
}

export default useWatchlist
