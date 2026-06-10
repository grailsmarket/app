'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { AuthenticationStatus } from '@rainbow-me/rainbowkit'
import { getGlobalMessages } from '@/api/globalChat/getMessages'
import { useUserContext } from '@/context/user'

const PAGE_SIZE = 50

export const useGlobalMessages = () => {
  const { authStatus } = useUserContext()
  const queryClient = useQueryClient()

  // The `reacted` flags are personalized per caller — refetch everything under
  // ['globalChat'] when the auth status flips (login/logout).
  const lastSettledAuth = useRef<AuthenticationStatus | null>(null)
  useEffect(() => {
    if (authStatus === 'loading') return
    if (lastSettledAuth.current && lastSettledAuth.current !== authStatus) {
      queryClient.invalidateQueries({ queryKey: ['globalChat'] })
    }
    lastSettledAuth.current = authStatus
  }, [authStatus, queryClient])

  const query = useInfiniteQuery({
    queryKey: ['globalChat', 'messages'],
    queryFn: ({ pageParam }) =>
      getGlobalMessages({
        before: pageParam ?? undefined,
        limit: PAGE_SIZE,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  })

  // Pages are newest-first, each page is also newest-first within itself.
  // Flatten and reverse so the consumer renders oldest → newest top-to-bottom.
  const flat = query.data?.pages.flatMap((p) => p.messages) ?? []
  const messages = [...flat].reverse()

  return {
    ...query,
    messages,
  }
}
