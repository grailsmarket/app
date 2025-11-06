import plus from '/icons/listed.svg'
import cartSold from '/icons/sold.svg'
import alarmClock from '/icons/expiring.svg'
import cartAccepted from '/icons/offer-accepted.svg'
import { NotificationType } from '@/types/notifications'

export const NOTIFICATION_CATEGORY_TO_ICON_MAP: Record<NotificationType, React.ReactNode> = {
  'new-listing': plus,
  'new-offer': cartAccepted,
  'price-change': alarmClock,
  sale: cartSold,
}

export const NOTIFICATION_CATEGORY_TO_MESSAGE: Record<NotificationType, string> = {
  'new-listing': 'Listed',
  'new-offer': 'Offer received',
  'price-change': 'Price changed',
  sale: 'Sold',
}
