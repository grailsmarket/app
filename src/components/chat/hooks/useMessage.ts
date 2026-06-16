import { ChatMessage } from '@/types/chat'
import { linkifyMessage } from '../utils/linkifyMessage'
import { useUserContext } from '@/context/user'
import { useToggleReaction } from '@/hooks/chat/useToggleReaction'
import { format } from 'date-fns'
import { usePeerProfile } from '@/hooks/chat/usePeerProfile'
import { formatAddress } from '@/utils/formatAddress'
import { useMemo } from 'react'

export const useMessage = (message: ChatMessage, chatId: string) => {
  const { authStatus } = useUserContext()
  const toggleReaction = useToggleReaction(chatId)

  const isDeleted = !!message.deleted_at
  const isEdited = !!message.edited_at && !isDeleted
  const time = format(new Date(message.created_at), 'h:mm a')
  const senderAddress = message.sender_address
  const senderProfile = usePeerProfile(senderAddress as `0x${string}` | undefined)
  const senderLabel = senderProfile?.displayLabel ?? (senderAddress ? formatAddress(senderAddress) : 'Unknown')

  const canReact = authStatus === 'authenticated' && !isDeleted && !message.id.startsWith('optimistic-')

  const onToggle = (emoji: string, currentlyReacted: boolean) => {
    toggleReaction.mutate({ messageId: message.id, emoji, currentlyReacted })
  }

  const onPick = (emoji: string) => {
    const existing = message.reactions?.find((r) => r.emoji === emoji)
    onToggle(emoji, existing?.reacted ?? false)
  }

  const body = useMemo(() => {
    if (isDeleted) {
      return message.deleted_by_admin ? 'This message was deleted by Admin' : 'This message was deleted by user'
    }
    return linkifyMessage(message.body ?? '')
  }, [isDeleted, message.deleted_by_admin, message.body])

  return {
    time,
    senderLabel,
    canReact,
    onToggle,
    onPick,
    body,
    isDeleted,
    isEdited,
    senderAddress,
    senderProfile,
  }
}
