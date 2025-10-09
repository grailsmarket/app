import Sold from 'public/svg/event_types/sale.svg'
import List from 'public/svg/event_types/list.svg'
import Transfer from 'public/svg/event_types/transfer.svg'
import Offered from 'public/svg/notifications/cart-accepted.svg'
import Registered from 'public/svg/event_types/registration.svg'
import Exclamation from 'public/svg/notifications/alarm-clock.svg'
import OfferCanceled from 'public/svg/notifications/cart-rejected.svg'
import ListingCanceled from 'public/svg/notifications/cart-rejected.svg'

export const eventIcons = {
  ask: { src: List, label: 'Listed' },
  expiring: { src: Exclamation, label: 'Domain expired' },
  bid: { src: Offered, label: 'Offered:' },
  ask_cancel: { src: ListingCanceled, label: 'Listing canceled:' },
  bid_cancel: { src: OfferCanceled, label: 'Offer canceled:' },
  sale: { src: Sold, label: 'Sold' },
  mint: { src: Registered, label: 'Registered' },
  transfer: { src: Transfer, label: 'Transfered' },
}

export const portfolioEventIcons = {
  listing: { src: List, label: 'Listed' },
  offer: { src: Offered, label: 'Offered:' },
  purchase: { src: Sold, label: 'Purchased' },
  sale: { src: Sold, label: 'Sold' },
  registration: { src: Registered, label: 'Registered' },
  premium_registration: { src: Registered, label: 'Premium Registration' },
  transfer: { src: Transfer, label: 'Transfered' },
} as const
