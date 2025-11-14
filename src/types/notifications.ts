export type NotificationType = 'new-listing' | 'price-change' | 'sale' | 'new-offer' | 'offer-received'

export interface NotificationMetadata {
  priceWei?: string
  sellerAddress?: string
  buyerAddress?: string
  listingId?: number
  offerId?: number
  offerAmountWei?: string
}

export interface Notification {
  id: number
  type: NotificationType
  ensName: string
  ensTokenId: string
  metadata: NotificationMetadata
  sentAt: string
  readAt: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationsResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface UnreadCountResponse {
  unreadCount: number
}

export interface MarkAsReadResponse {
  id: number
  readAt: string
}

export interface MarkAllAsReadResponse {
  markedCount: number
  message: string
}
