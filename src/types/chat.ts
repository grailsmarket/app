import { Address } from 'viem'
import type { PaginationType } from './api'

export type ChatType = 'direct' | 'group'

export interface ChatParticipant {
  user_id: number
  address: Address
  role: 'member' | 'admin'
  joined_at: string
  left_at: string | null
  last_read_message_id: string | null
  muted?: boolean
}

export interface MessageReaction {
  emoji: string
  count: number
  /** TRUE when the caller has reacted with this emoji. Always false for anonymous callers. */
  reacted: boolean
}

/** A single reactor, returned by GET …/reactions. */
export interface ReactionUser {
  address: string
}

/** Reactions grouped by emoji with the reactor addresses (who-reacted view). */
export interface ReactionWithUsers {
  emoji: string
  count: number
  users: ReactionUser[]
}

/** Compact preview of the parent message when this message is a reply. */
export interface ReplyPreview {
  id: string
  sender_address?: string
  /** null when the parent has been deleted */
  body: string | null
  deleted: boolean
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
  /** TRUE when an admin (not the author) soft-deleted the message. Only meaningful when deleted_at is set. */
  deleted_by_admin?: boolean
  /** Parent-message preview when this message is a reply; null/absent otherwise. */
  reply_to?: ReplyPreview | null
  reactions?: MessageReaction[]
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
  /** TRUE when the caller has the other participant in their message_blocks list. */
  is_blocked_by_me?: boolean
}

export interface Block {
  user_id: number
  address: string
  created_at: string
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

export interface SendMessageError {
  status: number
  code: string
  message: string
  quota?: GlobalChatQuota
}

export interface MappedSendError {
  message: string
  permanent?: boolean
  restoreText?: boolean
}

export type MentionState = {
  start: number
  query: string
}

// ---- Global chat ----

export interface SendVars {
  body: string
  /** Parent message id when sending a reply. */
  replyToId?: string
  /** Parent preview for optimistic rendering; server returns the canonical reply_to. */
  replyTo?: ReplyPreview | null
}

export interface SendController {
  isPending: boolean
  mutate: (vars: SendVars, options: { onError: (e: SendMessageError) => void }) => void
}

export interface GlobalChatQuota {
  tier: 'avatar' | 'name' | 'none'
  used: number
  /** null = unlimited */
  limit: number | null
  /** null = unlimited */
  remaining: number | null
  resets_at: string
}

export interface OnlineUser {
  user_id: number
  address: Address
  last_sign_in: string | null
  /** Most recent activity (last_seen_at or last_sign_in, whichever is newer). */
  last_active: string | null
}

export interface OnlineUsersResponse {
  users: OnlineUser[]
  pagination: PaginationType
}

// ---- WebSocket protocol ----

export type ChatWSEvent =
  | { type: 'connected'; clientId: string; userId: number | null; channel: 'chats'; timestamp: string }
  | { type: 'subscribed' | 'unsubscribed'; channel: 'chats' | 'global_chat'; timestamp: string }
  | { type: 'pong'; timestamp: string }
  | { type: 'error'; message: string }
  | {
      type: 'chat:message_new'
      data: { chat_id: string; message: ChatMessage }
      timestamp: string
    }
  | {
      type: 'chat:message_edited'
      data: { chat_id: string; message: ChatMessage }
      timestamp: string
    }
  | {
      type: 'chat:message_deleted'
      data: { chat_id: string; message_id: string; deleted_by_admin: boolean }
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
  | {
      type: 'chat:reaction_added' | 'chat:reaction_removed'
      /** `count` is the ABSOLUTE per-emoji count after the change */
      data: { chat_id: string; message_id: string; user_id: number; address: string; emoji: string; count: number }
      timestamp: string
    }
  | {
      /** Nudge to re-fetch the unread-notification count (chat reply/mention written). */
      type: 'notification:unread'
      data: Record<string, never>
      timestamp: string
    }

export type ChatWSOutgoing =
  | { type: 'subscribe' }
  | { type: 'unsubscribe' }
  | { type: 'subscribe_global' }
  | { type: 'unsubscribe_global' }
  | { type: 'typing'; chat_id: string }
  | { type: 'stop_typing'; chat_id: string }
  | { type: 'ping' }
