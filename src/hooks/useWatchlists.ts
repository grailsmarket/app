'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  addWatchlistList,
  removeWatchlistList,
  selectUserProfile,
  setSelectedWatchlistListId,
  setWatchlistLists,
  updateWatchlistList,
} from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'
import { getWatchlistLists } from '@/api/watchlist/lists/getLists'
import { createWatchlistList } from '@/api/watchlist/lists/createList'
import { editWatchlistList, setDefaultWatchlistList } from '@/api/watchlist/lists/editList'
import { deleteWatchlistList } from '@/api/watchlist/lists/deleteList'

const ALLOWED_TIERS = ['plus', 'pro', 'gold'] as const

const useWatchlists = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { userAddress, authStatus } = useUserContext()
  const profile = useAppSelector(selectUserProfile)
  const watchlistLists = profile.watchlistLists ?? []
  const selectedWatchlistListId = profile.selectedWatchlistListId ?? null
  const subscription = profile.subscription

  const canManageLists = useMemo(
    () => ALLOWED_TIERS.includes(subscription?.tier as (typeof ALLOWED_TIERS)[number]),
    [subscription?.tier]
  )

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['watchlistLists', userAddress],
    queryFn: getWatchlistLists,
    enabled: !!userAddress && authStatus === 'authenticated',
  })

  useEffect(() => {
    if (data) dispatch(setWatchlistLists(data))
  }, [data, dispatch])

  const defaultList = useMemo(() => watchlistLists.find((list) => list.isDefault) ?? null, [watchlistLists])

  const selectedList = useMemo(
    () =>
      watchlistLists.find((list) => list.id === selectedWatchlistListId) ?? defaultList ?? watchlistLists[0] ?? null,
    [watchlistLists, selectedWatchlistListId, defaultList]
  )

  const selectList = useCallback(
    (listId: number | null) => {
      dispatch(setSelectedWatchlistListId(listId))
    },
    [dispatch]
  )

  const invalidateLists = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['watchlistLists', userAddress] })
  }, [queryClient, userAddress])

  const createMutation = useMutation({
    mutationFn: createWatchlistList,
    onSuccess: (list) => {
      dispatch(addWatchlistList(list))
      invalidateLists()
    },
  })

  const editMutation = useMutation({
    mutationFn: editWatchlistList,
    onSuccess: (list) => {
      dispatch(updateWatchlistList(list))
      invalidateLists()
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultWatchlistList,
    onSuccess: () => {
      invalidateLists()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteWatchlistList,
    onSuccess: ({ listId }) => {
      dispatch(removeWatchlistList(listId))
      invalidateLists()
    },
  })

  return {
    lists: watchlistLists,
    defaultList,
    selectedList,
    selectedListId: selectedList?.id ?? null,
    selectList,
    isLoading,
    refetch,
    canManageLists,
    createList: createMutation.mutate,
    createListAsync: createMutation.mutateAsync,
    isCreatingList: createMutation.isPending,
    createListError: createMutation.error as (Error & { code?: string }) | null,
    editList: editMutation.mutate,
    editListAsync: editMutation.mutateAsync,
    isEditingList: editMutation.isPending,
    editListError: editMutation.error as (Error & { code?: string }) | null,
    deleteList: deleteMutation.mutate,
    deleteListAsync: deleteMutation.mutateAsync,
    isDeletingList: deleteMutation.isPending,
    deleteListError: deleteMutation.error as (Error & { code?: string }) | null,
    setDefaultList: setDefaultMutation.mutate,
    setDefaultListAsync: setDefaultMutation.mutateAsync,
    isSettingDefaultList: setDefaultMutation.isPending,
  }
}

export default useWatchlists
