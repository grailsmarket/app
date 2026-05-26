import { PaginationType } from './api'

export type SupportTicketStatus = 'open' | 'closed' | 'fixed'

export interface SupportTicket {
  id: number
  userId: number
  userAddress: string | null
  subject: string
  urls: string[]
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
  lastAdminReplyAt: string | null
  lastUserReplyAt: string | null
  messageCount?: number
}

export interface SupportTicketMessage {
  id: number
  ticketId: number
  authorUserId: number
  authorAddress: string | null
  authorRole: 'user' | 'admin'
  body: string
  createdAt: string
}

export interface SupportTicketDetail {
  ticket: SupportTicket
  messages: SupportTicketMessage[]
}

export interface SupportTicketsListResponse {
  tickets: SupportTicket[]
  pagination: PaginationType
}

export interface CreateTicketPayload {
  subject: string
  body: string
  urls: string[]
}
