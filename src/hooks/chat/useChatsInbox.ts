'use client'

import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { getChats } from '@/api/chats/getChats'
import { useUserContext } from '@/context/user'
import { useMessagingKeypair } from './useMessagingKeypair'
import { tryDecryptMessage } from '@/lib/crypto'
import type { Chat } from '@/types/chat'

const INBOX_PAGE_SIZE = 20

export const useChatsInbox = () => {
  const { userAddress, authStatus } = useUserContext()
  const keypair = useMessagingKeypair()

  const query = useInfiniteQuery({
    queryKey: ['chats', 'inbox'],
    queryFn: ({ pageParam = 1 }) => getChats({ page: pageParam, limit: INBOX_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined),
    enabled: !!userAddress && authStatus === 'authenticated',
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  // Decorate each chat's `last_message` with `decrypted_body` so previews can
  // render plaintext. Per-row peer pubkey lives on the chat's participants.
  const chats = useMemo<Chat[]>(() => {
    const raw = query.data?.pages.flatMap((p) => p.chats) ?? []
    if (!userAddress) return raw
    return raw.map((c) => {
      if (!c.last_message) return c
      const decrypted = tryDecryptMessage(c.last_message, userAddress, keypair, c.participants ?? [])
      return { ...c, last_message: decrypted }
    })
  }, [query.data, userAddress, keypair])

  const totalUnread = chats.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)

  return {
    ...query,
    chats,
    totalUnread,
  }
}

/** Standalone hook for the icon badge: same query key as the inbox so the cache is shared. */
export const useChatsUnreadTotal = () => {
  const { chats } = useChatsInbox()
  return chats.reduce((sum, c) => sum + (c.unread_count ?? 0), 0)
}
