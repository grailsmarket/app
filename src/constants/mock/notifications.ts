import { NotificationType } from '@/state/reducers/notifications'

export const MOCK_NOTIFICATIONS: NotificationType[] = [
  {
    category: 'offerAccepted',
    domain: 'domain.eth',
    timestamp: 1686347179,
    value: '2.3',
    units: 'ETH',
  },
  {
    category: 'sold',
    domain: 'domain.eth',
    timestamp: 1717726800,
    value: '270',
    units: 'USD',
  },
]

export const MOCK_FOLLOWING: NotificationType[] = [
  {
    category: 'domainListed',
    domain: 'domain.eth',
    timestamp: 1686343479,
    value: '0.25',
    units: 'ETH',
    user: 'dan.eth',
  },
  {
    category: 'domainListed',
    domain: 'domain.eth',
    timestamp: 1686346179,
    value: '0.25',
    units: 'ETH',
    user: 'dan.eth',
  },
  {
    category: 'domainListed',
    domain: 'domain.eth',
    timestamp: 1684346179,
    value: '0.25',
    units: 'ETH',
    user: 'dan.eth',
  },
]
