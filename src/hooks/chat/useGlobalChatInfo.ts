'use client'

import { useQuery } from '@tanstack/react-query'
import { getGlobalChatInfo } from '@/api/globalChat/getChatInfo'
import { SECOND } from 'ethereum-identity-kit'

/** Public room info incl. the `images_enabled` kill-switch + `max_image_bytes` cap. */
export const useGlobalChatInfo = () =>
  useQuery({
    queryKey: ['globalChat', 'info'],
    queryFn: getGlobalChatInfo,
    staleTime: 15 * SECOND,
  })
