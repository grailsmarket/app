'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'
import { getSavedSearches } from '@/api/savedSearches/getSavedSearches'
import { createSavedSearch } from '@/api/savedSearches/createSavedSearch'
import { updateSavedSearch } from '@/api/savedSearches/updateSavedSearch'
import { deleteSavedSearch } from '@/api/savedSearches/deleteSavedSearch'
import { SavedSearch, SavedSearchErrorCode } from '@/api/savedSearches/types'
import { matchMarketplaceFilters } from '@/components/modal/saved-searches/components/savedSearchRow'
import { setSavedSearchActive } from '@/state/reducers/modals/savedSearchesModal'
import { selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'

const ALLOWED_TIERS = ['plus', 'pro', 'gold'] as const

const useSavedSearches = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { userAddress, authStatus } = useUserContext()
  const profile = useAppSelector(selectUserProfile)
  const filters = useAppSelector(selectMarketplaceFilters)
  const subscription = profile.subscription

  const canManageSavedSearches = useMemo(
    () => ALLOWED_TIERS.includes(subscription?.tier as (typeof ALLOWED_TIERS)[number]),
    [subscription?.tier]
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['savedSearches', userAddress],
    queryFn: getSavedSearches,
    enabled: !!userAddress && authStatus === 'authenticated' && canManageSavedSearches,
  })

  const savedSearches = data ?? []
  const defaultSavedSearch = useMemo(() => savedSearches.find((s) => s.isDefault) ?? null, [savedSearches])

  useEffect(() => {
    const anySearchActive = savedSearches.some((search) => matchMarketplaceFilters(search, filters))
    dispatch(setSavedSearchActive(anySearchActive))
  }, [savedSearches, dispatch, filters])

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['savedSearches', userAddress] })
  }, [queryClient, userAddress])

  const createMutation = useMutation({
    mutationFn: createSavedSearch,
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: updateSavedSearch,
    onSuccess: invalidate,
    // optimistic update
    onMutate: async (saved) => {
      await queryClient.cancelQueries({ queryKey: ['savedSearches', userAddress] })
      const previousSavedSearches = queryClient.getQueryData<SavedSearch[]>(['savedSearches', userAddress])
      queryClient.setQueryData(['savedSearches', userAddress], (old: SavedSearch[] | undefined) => {
        // handle updating ALL saved searches default status
        const isDefault = saved.isDefault
        const newSavedSearches = old?.map((s) =>
          s.id === saved.id ? saved : isDefault ? { ...s, isDefault: false } : s
        )

        return newSavedSearches
      })

      return { previousSavedSearches }
    },
    // rollback optimistic update if error
    onError: (error, saved, context) => {
      queryClient.setQueryData(['savedSearches', userAddress], context?.previousSavedSearches)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSavedSearch,
    onSuccess: invalidate,
  })

  type ErrWithCode = Error & { code?: SavedSearchErrorCode }

  return {
    savedSearches,
    defaultSavedSearch,
    isLoading,
    refetch,
    canManageSavedSearches,
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error as ErrWithCode | null,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error as ErrWithCode | null,
    remove: deleteMutation.mutate,
    removeAsync: deleteMutation.mutateAsync,
    isRemoving: deleteMutation.isPending,
    removeError: deleteMutation.error as ErrWithCode | null,
  }
}

export default useSavedSearches
