import { NotificationCategoryType } from '@/state/reducers/notifications'
import plus from '/icons/listed.svg'
import cartSold from '/icons/sold.svg'
import alarmClock from '/icons/expiring.svg'
import cartAccepted from '/icons/offer-accepted.svg'

export const NOTIFICATION_CATEGORY_TO_ICON_MAP: Record<NotificationCategoryType, React.ReactNode> = {
  domainExpired: alarmClock,
  sold: cartSold,
  offerAccepted: cartAccepted,
  domainListed: plus,
}

export const NOTIFICATION_CATEGORY_TO_MESSAGE: Record<NotificationCategoryType, string> = {
  domainExpired: 'Domain expiring',

  sold: 'Sold',
  offerAccepted: 'Offer accepted:',
  domainListed: 'listed',
}
