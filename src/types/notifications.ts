export type NotificationType =
  | 'new-listing'
  | 'price-change'
  | 'sale'
  | 'new-offer'
  | 'offer-received'
  | 'listing-sold'
  | 'listing-cancelled-ownership-change'
  | 'admin-broadcast'

export interface NotificationMetadata {
  title?: string
  body?: string
  linkUrl?: string
  imageUrl?: string
  broadcastId?: number
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
  ensName: string | null
  ensTokenId: string | null
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
