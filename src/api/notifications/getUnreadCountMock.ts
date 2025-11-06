import { MOCK_UNREAD_COUNT } from '@/constants/mock/notifications'

export const getUnreadCountMock = async (): Promise<number> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  return MOCK_UNREAD_COUNT
}