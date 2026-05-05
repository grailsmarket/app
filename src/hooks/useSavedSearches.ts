'use client'

import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'
import { getSavedSearches } from '@/api/savedSearches/getSavedSearches'
import { createSavedSearch } from '@/api/savedSearches/createSavedSearch'
import { updateSavedSearch } from '@/api/savedSearches/updateSavedSearch'
import { deleteSavedSearch } from '@/api/savedSearches/deleteSavedSearch'
import { SavedSearchErrorCode } from '@/api/savedSearches/types'

const ALLOWED_TIERS = ['plus', 'pro', 'gold'] as const

const useSavedSearches = () => {
  const queryClient = useQueryClient()
  const { userAddress, authStatus } = useUserContext()
  const profile = useAppSelector(selectUserProfile)
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
