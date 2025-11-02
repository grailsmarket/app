'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  addUserWatchlistDomain,
  removeUserWatchlistDomain,
  selectUserProfile,
} from '../state/reducers/portfolio/profile'
import type { MarketplaceDomainType, WatchlistItemType } from '../types/domains'
import { addToWatchlist } from '@/api/watchlist/addToWatchlist'
import { removeFromWatchlist } from '@/api/watchlist/removeFromWatchlist'
import { checkWatchlist } from '@/api/watchlist/checkWatchlist'
import { useUserContext } from '@/context/user'

const useWatchlist = (name: string) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { userAddress, authStatus } = useUserContext()
  const [watchlistCountChange, setWatchlistCountChange] = useState(0)

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
            hasActiveListing: domain.listings.length > 0,
            listingPrice: domain.listings[0].price,
            expiryDate: domain.expiry_date,
            activeListing: domain.listings[0],
          },
        }

        dispatch(addUserWatchlistDomain(item))
        invalidateWatchlist()
        setWatchlistCountChange(watchlistCountChange + 1)
      }
    },
    onError: (error: any, domain) => {
      console.error(`Error adding ${domain.name} to watchlist`, error)
    },
  })

  const removeFromWatchlistMutation = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: (response) => {
      if (response.success) {
        dispatch(removeUserWatchlistDomain(response.watchlistId))
        setWatchlistCountChange(watchlistCountChange - 1)
        invalidateWatchlist()
      }
    },
    onError: (error: any, watchlistId) => {
      console.error(`Error removing watchlist item ID-${watchlistId}`, error)
    },
  })

  const { watchlist } = useAppSelector(selectUserProfile)
  const { data: watchlistItem } = useQuery({
    queryKey: ['isWatchlisted', name, userAddress],
    queryFn: () => checkWatchlist(name),
    enabled: !!name && !!userAddress && authStatus === 'authenticated',
  })

  const isWatching = useMemo(
    () => watchlistItem?.isWatching || watchlist?.some((item) => item.ensName === name),
    [watchlistItem, watchlist, name]
  )

  const toggleWatchlist = (domain: MarketplaceDomainType) => {
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
  }
}

export default useWatchlist
