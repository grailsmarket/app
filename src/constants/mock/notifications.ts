import { Notification, NotificationsResponse } from '@/types/notifications'

// Mock notifications matching the API structure
export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: 'new-listing',
    ensName: 'brantly.eth',
    ensTokenId: '123456',
    metadata: {
      priceWei: '500000000000000000', // 0.5 ETH
      sellerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
      listingId: 101,
    },
    sentAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    readAt: null,
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'sale',
    ensName: 'mobile.eth',
    ensTokenId: '789012',
    metadata: {
      priceWei: '300000000000000000', // 0.3 ETH
      sellerAddress: '0x123d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
      buyerAddress: '0x456d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
    },
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'new-offer',
    ensName: 'coolname.eth',
    ensTokenId: '345678',
    metadata: {
      priceWei: '300000000000000000', // 0.3 ETH
      offerId: 201,
    },
    sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    readAt: null,
    isRead: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'sale',
    ensName: 'cars.eth',
    ensTokenId: '901234',
    metadata: {
      priceWei: '300000000000000000', // 0.3 ETH
      sellerAddress: '0x789d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
      buyerAddress: '0xABCd35Cc6634C0532925a3b844Bc9e7595f2bD7e',
    },
    sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    readAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    type: 'price-change',
    ensName: 'premium.eth',
    ensTokenId: '567890',
    metadata: {
      priceWei: '1000000000000000000', // 1 ETH
      listingId: 301,
    },
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    readAt: null,
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    type: 'new-listing',
    ensName: 'web3.eth',
    ensTokenId: '234567',
    metadata: {
      priceWei: '5000000000000000000', // 5 ETH
      sellerAddress: '0xDEFd35Cc6634C0532925a3b844Bc9e7595f2bD7e',
      listingId: 401,
    },
    sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    readAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 7,
    type: 'new-offer',
    ensName: 'crypto.eth',
    ensTokenId: '678901',
    metadata: {
      priceWei: '750000000000000000', // 0.75 ETH
      offerId: 501,
    },
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    readAt: null,
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 8,
    type: 'sale',
    ensName: 'defi.eth',
    ensTokenId: '012345',
    metadata: {
      priceWei: '2500000000000000000', // 2.5 ETH
      sellerAddress: '0x111d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
      buyerAddress: '0x222d35Cc6634C0532925a3b844Bc9e7595f2bD7e',
    },
    sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    readAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Mock API response
export const MOCK_NOTIFICATIONS_RESPONSE: NotificationsResponse = {
  notifications: MOCK_NOTIFICATIONS,
  pagination: {
    page: 1,
    limit: 20,
    total: MOCK_NOTIFICATIONS.length,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
}

// Mock unread count (notifications where isRead is false)
export const MOCK_UNREAD_COUNT = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length
