import type { ChatWSOutgoing } from '@/types/chat'

/**
 * Module-level singleton holding the active /ws/chats socket. The provider-level
 * useChatSocket hook owns the connection lifecycle and sets/clears this ref.
 * Components like the composer call sendChatEvent(...) to emit typing events.
 *
 * No-ops when the socket is closed or absent — the server typing model is
 * best-effort and self-throttling, so dropped events are fine.
 */
let activeSocket: WebSocket | null = null

export const setChatSocket = (ws: WebSocket | null) => {
  activeSocket = ws
}

export const sendChatEvent = (msg: ChatWSOutgoing) => {
  const ws = activeSocket
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}
