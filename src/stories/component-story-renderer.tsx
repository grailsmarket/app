import React from 'react'

import { ETH_ADDRESS, USDC_ADDRESS, WETH_ADDRESS } from '@/constants/web3/tokens'

const modules = {
  ...import.meta.glob('../components/**/*.tsx', { eager: true }),
  ...import.meta.glob('../app/**/components/**/*.tsx', { eager: true }),
} as Record<string, Record<string, unknown>>

const noop = () => {}
const asyncNoop = async () => {}
const now = new Date('2026-01-15T12:00:00.000Z').toISOString()
const address = '0x0000000000000000000000000000000000000001'
const hex = '0x0000000000000000000000000000000000000000000000000000000000000000'
const nowSeconds = 1768478400

const mockOrderData = {
  orderHash: address,
  signature: hex,
  parameters: {
    salt: hex,
    zone: address,
    offer: [
      {
        token: address,
        itemType: 2,
        endAmount: '1250000000000000000',
        startAmount: '1250000000000000000',
        identifierOrCriteria: hex,
      },
    ],
    counter: '0',
    endTime: String(nowSeconds + 86400),
    offerer: address,
    zoneHash: hex,
    orderType: 0,
    startTime: String(nowSeconds),
    conduitKey: address,
    consideration: [
      {
        token: address,
        itemType: 0,
        endAmount: '1250000000000000000',
        recipient: address,
        startAmount: '1250000000000000000',
        identifierOrCriteria: hex,
      },
    ],
    totalOriginalConsiderationItems: 1,
  },
  marketplace: 'grails',
  usesConduit: true,
  protocol_data: {
    signature: hex,
    conduitKey: hex,
    conduitAddress: address,
    parameters: {
      salt: hex,
      zone: address,
      offer: [
        {
          token: address,
          itemType: 2,
          endAmount: '1250000000000000000',
          startAmount: '1250000000000000000',
          identifierOrCriteria: hex,
        },
      ],
      counter: '0',
      endTime: String(nowSeconds + 86400),
      offerer: address,
      zoneHash: hex,
      orderType: 0,
      startTime: String(nowSeconds),
      conduitKey: address,
      consideration: [
        {
          token: address,
          itemType: 0,
          endAmount: '1250000000000000000',
          recipient: address,
          startAmount: '1250000000000000000',
          identifierOrCriteria: hex,
        },
      ],
      totalOriginalConsiderationItems: 1,
    },
  },
}

const mockListing = {
  id: 1,
  price: '1.25',
  price_wei: '1250000000000000000',
  currency_address: ETH_ADDRESS,
  status: 'active',
  seller_address: address,
  order_hash: hex,
  order_data: mockOrderData,
  expires_at: now,
  created_at: now,
  source: 'grails',
  broker_address: null,
  broker_fee_bps: null,
}

const mockDomain = {
  id: 1,
  name: 'grails.eth',
  token_id: '123456789',
  owner: address,
  expiry_date: '2027-01-15T12:00:00.000Z',
  registration_date: '2022-01-15T12:00:00.000Z',
  creation_date: '2022-01-15T12:00:00.000Z',
  metadata: {},
  has_numbers: false,
  has_emoji: false,
  clubs: ['english', 'premium'],
  club_ranks: [{ club: 'english', rank: 7 }],
  listings: [mockListing],
  highest_offer_wei: '900000000000000000',
  highest_offer_id: 9,
  highest_offer_currency: WETH_ADDRESS,
  offer: '0.9',
  last_sale_price: '1.1',
  last_sale_price_usd: '3300',
  last_sale_currency: ETH_ADDRESS,
  last_sale_date: now,
  view_count: 420,
  watchers_count: 12,
  downvotes: 1,
  upvotes: 32,
  watchlist_record_id: 1,
  watchlist: {
    notifyOnSale: true,
    notifyOnOffer: true,
    notifyOnListing: true,
    notifyOnPriceChange: true,
    notifyOnComment: true,
  },
}

const mockOffer = {
  id: 1,
  ens_name_id: 1,
  buyer_address: address,
  offer_amount_wei: '900000000000000000',
  currency_address: WETH_ADDRESS,
  status: 'active',
  created_at: now,
  expires_at: now,
  source: 'grails',
  name: mockDomain.name,
  token_id: mockDomain.token_id,
  order_data: mockOrderData,
  order_hash: hex,
}

const mockCategory = {
  id: 1,
  name: 'Premium Names',
  slug: 'premium-names',
  count: 1234,
  floor_price: '1.2',
  volume: '128',
  image: '/logo.svg',
}

const commonProps = {
  account: { address, avatar: null, displayName: 'grails.eth', name: 'grails.eth' },
  activity: {
    asset: 'ETH',
    domain: mockDomain.name,
    end_time: 1700000000,
    event_type: 'sale',
    from_addr: address,
    price: '1.25',
    start_time: 1700000000,
    to_addr: address,
  },
  activities: [],
  alignTooltip: 'center',
  calculationResults: {
    totalPrice: BigInt(1250000000000000000),
    basePrice: BigInt(1000000000000000000),
    premiumPrice: BigInt(0),
    durationSeconds: BigInt(31536000),
  },
  categories: [mockCategory],
  category: mockCategory,
  categorySlug: mockCategory.slug,
  className: '',
  columnCount: 6,
  comment: {
    id: 1,
    body: 'This is a Storybook comment.',
    author: { displayName: 'grails.eth', avatar: null, address },
    createdAt: now,
  },
  comments: [],
  currency: 'ETH',
  currencyAddress: ETH_ADDRESS,
  currencyOptions: [ETH_ADDRESS, WETH_ADDRESS, USDC_ADDRESS],
  data: [
    { date: 'Jan', value: 12 },
    { date: 'Feb', value: 18 },
    { date: 'Mar', value: 9 },
  ],
  displayedColumns: ['domain', 'price', 'last_sale', 'highest_offer', 'expires', 'actions'],
  domain: mockDomain,
  domainIsValid: true,
  domains: [mockDomain, { ...mockDomain, id: 2, name: 'market.eth', token_id: '987654321' }],
  error: 'Something went wrong.',
  filterType: 'marketplace',
  hideDomainActions: false,
  hideIcon: false,
  index: 0,
  isLoading: false,
  isOpen: true,
  label: 'Storybook label',
  listing: mockListing,
  listings: [mockListing],
  name: mockDomain.name,
  names: [mockDomain.name, 'market.eth', 'ens.eth'],
  notification: {
    id: 1,
    type: 'sale',
    title: 'Sale complete',
    body: 'grails.eth sold for 1.25 ETH',
    created_at: now,
    read: false,
    data: { domain: mockDomain.name },
  },
  offer: mockOffer,
  offers: [mockOffer],
  onChange: noop,
  onClick: noop,
  onClose: noop,
  onDelete: noop,
  onOpen: noop,
  onSearch: noop,
  onSelect: noop,
  open: true,
  owner: address,
  placeholder: 'Search names',
  price: '1250000000000000000',
  profile: { address, avatar: null, displayName: 'grails.eth', name: 'grails.eth', followers: 120, following: 80 },
  registrationStatus: 'available',
  searchTerm: 'grails',
  selectedTab: 'domains',
  setExpandedImage: noop,
  setIsLiveActivityConnected: noop,
  setOpen: noop,
  setSelectedTab: noop,
  showFullPrice: true,
  source: 'grails',
  timestamp: now,
  title: 'Storybook Component',
  totalCount: 2,
  user: { address, avatar: null, displayName: 'grails.eth', name: 'grails.eth' },
  value: 'grails.eth',
  usdPrice: '3125',
  verify: asyncNoop,
}

class StoryErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className='border-grace bg-secondary text-foreground max-w-xl rounded-xl border p-4'>
          <p className='text-grace mb-2 text-lg font-semibold'>Component render error</p>
          <pre className='text-neutral text-sm whitespace-pre-wrap'>{this.state.error.message}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

const getRenderableExport = (module: Record<string, unknown>) => {
  if (typeof module.default === 'function') return module.default as React.ComponentType<Record<string, unknown>>

  const namedExport = Object.entries(module).find(([name, value]) => /^[A-Z]/.test(name) && typeof value === 'function')
  return namedExport?.[1] as React.ComponentType<Record<string, unknown>> | undefined
}

export const ComponentStoryRenderer = ({ path }: { path: string }) => {
  const module = modules[path.replace(/^src\//, '../')]
  const Component = module ? getRenderableExport(module) : undefined

  if (!Component) {
    return (
      <div className='border-tertiary bg-secondary text-foreground max-w-xl rounded-xl border p-4'>
        <p className='mb-2 text-lg font-semibold'>No React component export found</p>
        <code className='text-neutral text-sm'>{path}</code>
      </div>
    )
  }

  return (
    <StoryErrorBoundary>
      <div className='text-foreground w-full max-w-6xl'>{React.createElement(Component, commonProps)}</div>
    </StoryErrorBoundary>
  )
}
