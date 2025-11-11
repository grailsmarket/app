'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  addUserPendingWatchlistDomain,
  addUserWatchlistDomain,
  removeUserPendingWatchlistDomain,
  removeUserWatchlistDomain,
  selectUserProfile,
} from '../state/reducers/portfolio/profile'
import type { MarketplaceDomainType, WatchlistItemType } from '../types/domains'
import { addToWatchlist } from '@/api/watchlist/addToWatchlist'
import { removeFromWatchlist } from '@/api/watchlist/removeFromWatchlist'
import { checkWatchlist } from '@/api/watchlist/checkWatchlist'
import { useUserContext } from '@/context/user'
import { updateWatchlistSettings, WatchlistSettingsType } from '@/api/watchlist/update'
import { selectMyDomainsFilters } from '@/state/reducers/filters/myDomainsFilters'

const useWatchlist = (name: string, tokenId: string, watchlistId: number | undefined) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const filters = useAppSelector(selectMyDomainsFilters)
  const { watchlist, pendingWatchlistTokenIds } = useAppSelector(selectUserProfile)
  const { userAddress, authStatus } = useUserContext()
  const [hasWatchlistedBefore, setHasWatchlistedBefore] = useState<boolean | undefined>(undefined)
  const [watchlistCountChange, setWatchlistCountChange] = useState(0)
  const [watchlistSettings, setWatchlistSettings] = useState<WatchlistSettingsType>({
    notifyOnSale: true,
    notifyOnOffer: true,
    notifyOnListing: true,
    notifyOnPriceChange: true,
  })

  const invalidateWatchlist = () => {
    queryClient.invalidateQueries({ queryKey: ['isWatchlisted', name] })
  }

  const addToWatchlistMutation = useMutation({
    mutationFn: addToWatchlist,
    onSuccess: ({ domain, response }) => {
      if (response) {
        const item: WatchlistItemType = {
          ...response,
          notifyOnSale: true,
          notifyOnOffer: true,
          notifyOnListing: true,
          notifyOnPriceChange: false,
          nameData: {
            name: domain.name,
            tokenId: domain.token_id,
            ownerAddress: domain.owner,
            hasActiveListing: domain.listings?.length > 0,
            listingPrice: domain.listings?.[0]?.price,
            expiryDate: domain.expiry_date,
            activeListing: domain.listings?.[0],
          },
        }

        dispatch(addUserWatchlistDomain(item))
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
    queryKey: ['isWatchlisted', name, userAddress],
    queryFn: async () => {
      const result = await checkWatchlist(name)

      if (result.isWatching) {
        if (hasWatchlistedBefore === undefined) setHasWatchlistedBefore(true)
        dispatch(addUserWatchlistDomain(result.watchlistEntry))
      } else {
        if (hasWatchlistedBefore === undefined) setHasWatchlistedBefore(false)
        dispatch(removeUserWatchlistDomain(result.watchlistEntry?.id))
      }
      return result
    },
    enabled: !!name && !!userAddress && authStatus === 'authenticated' && !watchlistId,
  })

  useEffect(() => {
    if (watchlistItem?.watchlistEntry) {
      setWatchlistSettings({
        notifyOnSale: watchlistItem.watchlistEntry.notifyOnSale,
        notifyOnOffer: watchlistItem.watchlistEntry.notifyOnOffer,
        notifyOnListing: watchlistItem.watchlistEntry.notifyOnListing,
        notifyOnPriceChange: watchlistItem.watchlistEntry.notifyOnPriceChange,
      })
    }
  }, [watchlistItem])

  const isWatching = useMemo(() => {
    if (watchlistId) {
      return true
    }

    if (pendingWatchlistTokenIds?.includes(tokenId) || removeFromWatchlistMutation.isPending) {
      if (watchlist.some((item) => item.ensName === name) || removeFromWatchlistMutation.isPending) {
        return false
      }

      return true
    }

    return watchlist?.some((item) => item.ensName === name)
  }, [watchlist, name, tokenId, pendingWatchlistTokenIds, removeFromWatchlistMutation.isPending, watchlistId])

  const toggleWatchlist = (domain: MarketplaceDomainType) => {
    if (watchlistId) {
      // This logic is here specifically for the watchlist tab in portfolio
      // It removes the watchlist item from the watchlist list because we fetch those directly from the API
      // This way we can avoid refetches, but still reflect the real state of the watchlist
      removeFromWatchlistMutation.mutate(watchlistId)
      dispatch(removeUserWatchlistDomain(watchlistId))
      queryClient.setQueryData(
        [
          'portfolio',
          'watchlist',
          userAddress,
          filters.search,
          filters.length,
          filters.priceRange,
          filters.categories,
          filters.type,
          filters.status,
          filters.sort,
        ],
        (old: any) => {
          const newData = old.pages.map((page: any) => {
            return {
              ...page,
              domains: page.domains.filter((item: any) => item.watchlist_id !== watchlistId),
            }
          })

          return {
            ...old,
            pages: newData,
          }
        }
      )
      // queryClient.refetchQueries({ queryKey: ['portfolio', 'watchlist'] })
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
      watchlistItem?.watchlistEntry?.id || watchlist?.find((item) => item.ensNameId === domain.id)?.id

    if (isWatching && watchlistItemId) {
      removeFromWatchlistMutation.mutate(watchlistItemId)
      return
    }

    addToWatchlistMutation.mutate(domain)
  }

  const isLoadingWatchlist = addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending

  return {
    isWatching,
    watchlistItem: watchlistItem?.watchlistEntry,
    toggleWatchlist,
    isLoading: isLoadingWatchlist,
    watchlistCountChange,
    watchlistSettings,
    setWatchlistSettings,
    updateWatchlistSettings: (settings: WatchlistSettingsType) => {
      setWatchlistSettings(settings)
      if (watchlistItem?.watchlistEntry?.id) {
        updateSettingsMutation.mutate({ watchlistId: watchlistItem?.watchlistEntry?.id, settings })
      } else {
        console.error('Watchlist item not found')
      }
    },
    isUpdatingSettings: updateSettingsMutation.isPending,
  }
}

export default useWatchlist
