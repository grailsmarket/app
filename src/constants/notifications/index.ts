import plus from '/icons/listed.svg'
import cartSold from '/icons/sold.svg'
import alarmClock from '/icons/expiring.svg'
import cartAccepted from '/icons/offer-accepted.svg'
import { NotificationType } from '@/types/notifications'
import Bell from 'public/icons/bell.svg'
import AlarmClock from 'public/icons/expiring.svg'

export const NOTIFICATION_CATEGORY_TO_ICON_MAP: Record<NotificationType, React.ReactNode> = {
  'new-listing': plus,
  'new-offer': cartAccepted,
  'price-change': alarmClock,
  sale: cartSold,
  'offer-received': cartAccepted,
  'listing-sold': cartSold,
  'listing-cancelled-ownership-change': AlarmClock,
  'comment-received': Bell,
  'admin-broadcast': Bell,
  chat_reply: Bell,
  chat_mention: Bell,
  listing_cancelled: AlarmClock,
  offer_cancelled: AlarmClock,
  listing_unfunded: AlarmClock,
  offer_unfunded: AlarmClock,
  listing_refunded: plus,
  offer_refunded: cartAccepted,
}

export const NOTIFICATION_CATEGORY_TO_MESSAGE: Record<NotificationType, string> = {
  'new-listing': 'Listed',
  'new-offer': 'Offer',
  'price-change': 'Price changed',
  sale: 'Sold',
  'offer-received': 'Offer received',
  'listing-sold': 'Sold',
  'listing-cancelled-ownership-change': 'Listing cancelled (ownership changed)',
  'comment-received': 'New Comment',
  'admin-broadcast': 'Announcement',
  chat_reply: 'Replied to you',
  chat_mention: 'Mentioned you',
  listing_cancelled: 'Listing cancelled',
  offer_cancelled: 'Offer cancelled',
  listing_unfunded: 'Listing unfunded',
  offer_unfunded: 'Offer unfunded',
  listing_refunded: 'Listing active again',
  offer_refunded: 'Offer active again',
}
