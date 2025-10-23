'use client'

import { useMutation } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  addUserWatchlistDomain,
  removeUserWatchlistDomain,
  selectUserProfile,
} from '../state/reducers/portfolio/profile'
import type { MarketplaceDomainType, WatchlistItemType } from '../types/domains'
import { addToWatchlist } from '@/api/watchlist/addToWatchlist'
import { removeFromWatchlist } from '@/api/watchlist/removeFromWatchlist'

const useWatchlist = () => {
  const dispatch = useAppDispatch()

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
            hasActiveListing: domain.status === 'listed',
            listingPrice: domain.price,
          },
        }

        dispatch(addUserWatchlistDomain(item))
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
      }
    },
    onError: (error: any, watchlistId) => {
      console.error(`Error removing watchlist item ID-${watchlistId}`, error)
    },
  })

  const { watchlist } = useAppSelector(selectUserProfile)
  const watchlistNames = watchlist?.map((domain) => domain.ensName)

  const toggleWatchlist = (domain: MarketplaceDomainType) => {
    const watchlistItem = watchlist.find((item) => item.ensName === domain.name)

    if (watchlistItem) {
      removeFromWatchlistMutation.mutate(watchlistItem?.id)
      return
    }

    addToWatchlistMutation.mutate(domain)
  }

  const isLoadingWatchlist = addToWatchlistMutation.isPending || removeFromWatchlistMutation.isPending

  return {
    watchlist,
    watchlistNames,
    toggleWatchlist,
    isLoading: isLoadingWatchlist,
  }
}

export default useWatchlist
