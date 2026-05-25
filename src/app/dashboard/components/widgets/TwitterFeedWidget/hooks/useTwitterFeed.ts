'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectTwitterFeedConfig } from '@/state/reducers/dashboard/selectors'
import { DEFAULT_HANDLE, HANDLE_REGEX } from '../constants'
import type { ExpandedMedia, TwitterPostsResponse } from '../types'
import { sanitizeHandle } from '../utils'

const fetchTwitterPosts = async ({
  handle,
  paginationToken,
}: {
  handle: string
  paginationToken?: string
}): Promise<TwitterPostsResponse> => {
  const params = new URLSearchParams({ handle, limit: '20' })
  if (paginationToken) params.set('paginationToken', paginationToken)

  const response = await fetch(`/api/twitter/posts?${params.toString()}`)
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(typeof payload?.error === 'string' ? payload.error : 'Unable to load X posts')
  }

  return payload as TwitterPostsResponse
}

export const useTwitterFeed = (instanceId: string) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectTwitterFeedConfig(state, instanceId))
  const handle = config?.handle || DEFAULT_HANDLE
  const [inputValue, setInputValue] = useState(handle)
  const [inputError, setInputError] = useState<string | null>(null)
  const [expandedMedia, setExpandedMedia] = useState<ExpandedMedia | null>(null)
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({ rootMargin: '600px 0px 600px 0px' })

  const canFetch = Boolean(config && HANDLE_REGEX.test(handle))

  const query = useInfiniteQuery({
    queryKey: ['twitter-posts', handle],
    queryFn: ({ pageParam }) => fetchTwitterPosts({ handle, paginationToken: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextToken ?? undefined,
    enabled: canFetch,
    staleTime: 60_000,
  })

  const posts = useMemo(() => query.data?.pages.flatMap((page) => page.posts) ?? [], [query.data])

  useEffect(() => {
    setInputValue(handle)
    setInputError(null)
  }, [handle])

  useEffect(() => {
    if (isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage()
    }
  }, [isIntersecting, query])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      const nextHandle = sanitizeHandle(inputValue)
      if (!HANDLE_REGEX.test(nextHandle)) {
        setInputError('Enter a valid X username.')
        return
      }

      setInputError(null)
      dispatch(updateComponentConfig({ id: instanceId, patch: { handle: nextHandle } }))
    },
    [dispatch, inputValue, instanceId]
  )

  return {
    config,
    expandedMedia,
    handle,
    handleSubmit,
    inputError,
    inputValue,
    loadMoreRef,
    posts,
    query,
    setExpandedMedia,
    setInputValue,
  }
}
