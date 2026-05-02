'use client'

import { useQuery } from '@tanstack/react-query'
import { getChat } from '@/api/chats/getChat'

export const useChat = (chatId: string | null) => {
  return useQuery({
    queryKey: ['chats', chatId, 'detail'],
    queryFn: () => getChat(chatId as string),
    enabled: !!chatId,
    staleTime: 60_000,
  })
}
