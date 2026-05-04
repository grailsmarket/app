'use client'

import { useChatSocket } from '@/hooks/chat/useChatSocket'

/**
 * Renders nothing — exists only to mount the chat WebSocket once at the
 * providers level so cache patches and unread badges keep updating regardless
 * of whether the chat sidebar is open.
 */
const ChatSocketMount: React.FC = () => {
  useChatSocket()
  return null
}

export default ChatSocketMount
