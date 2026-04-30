import type { PaginationType } from './api'

export type ChatType = 'direct' | 'group'

export interface ChatParticipant {
  user_id: number
  address: string
  role: 'member' | 'admin'
  joined_at: string
  left_at: string | null
  last_read_message_id: string | null
  muted?: boolean
}

export interface ChatMessage {
  id: string
  chat_id: string
  sender_user_id: number
  sender_address?: string
  /** null when the message has been soft-deleted */
  body: string | null
  content_type: 'text'
  metadata: unknown
  created_at: string
  edited_at: string | null
  deleted_at: string | null
}

export interface Chat {
  id: string
  type: ChatType
  title: string | null
  dm_key: string | null
  created_by_user_id: number
  created_at: string
  last_message_at: string | null
  /** Caller's read pointer, present on inbox rows */
  last_read_message_id?: string | null
  /** Caller's per-chat mute, present on inbox rows */
  muted?: boolean
  participants?: ChatParticipant[]
  last_message?: ChatMessage | null
  unread_count?: number
}

export interface ChatInboxResponse {
  chats: Chat[]
  pagination: PaginationType
}

export interface ChatMessagesResponse {
  messages: ChatMessage[]
  nextCursor: string | null
}

export interface CreateChatResponse {
  chat: Chat
  created: boolean
}

// ---- WebSocket protocol ----

export type ChatWSEvent =
  | { type: 'connected'; clientId: string; userId: number; channel: 'chats'; timestamp: string }
  | { type: 'subscribed' | 'unsubscribed'; channel: 'chats'; timestamp: string }
  | { type: 'pong'; timestamp: string }
  | { type: 'error'; message: string }
  | {
      type: 'chat:message_new'
      data: { chat_id: string; message: ChatMessage }
      timestamp: string
    }
  | {
      type: 'chat:message_deleted'
      data: { chat_id: string; message_id: string }
      timestamp: string
    }
  | {
      type: 'chat:read'
      data: { chat_id: string; user_id: number; last_read_message_id: string }
      timestamp: string
    }
  | {
      type: 'chat:typing' | 'chat:typing_stop'
      data: { chat_id: string; user_id: number }
      timestamp: string
    }
  | { type: 'chat:created'; data: { chat: Chat }; timestamp: string }

export type ChatWSOutgoing =
  | { type: 'subscribe' }
  | { type: 'unsubscribe' }
  | { type: 'typing'; chat_id: string }
  | { type: 'stop_typing'; chat_id: string }
  | { type: 'ping' }
