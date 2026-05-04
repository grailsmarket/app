'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createChat, type CreateChatError } from '@/api/chats/createChat'
import type { CreateChatResponse } from '@/types/chat'

export const useCreateChat = () => {
  const queryClient = useQueryClient()

  return useMutation<CreateChatResponse, CreateChatError, string>({
    mutationFn: (recipient: string) => createChat(recipient),
    onSuccess: (data) => {
      // If a brand-new chat was created, the inbox is stale.
      if (data.created) {
        queryClient.invalidateQueries({ queryKey: ['chats', 'inbox'] })
      }
      // Seed the chat detail cache so the thread can render immediately…
      queryClient.setQueryData(['chats', data.chat.id, 'detail'], data.chat)
      // …but the POST /chats response is sparser than GET /chats/:id (notably,
      // it omits the peer participant), so mark it stale to trigger a refetch
      // as soon as the thread mounts. Without this, peer profile data won't
      // appear until the first message exchange invalidates the cache.
      queryClient.invalidateQueries({ queryKey: ['chats', data.chat.id, 'detail'] })
    },
  })
}
