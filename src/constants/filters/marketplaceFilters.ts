export const MARKETPLACE_OPENABLE_FILTERS = ['Status', 'Type', 'Length', 'Price Range', 'Activity'] as const

export const MARKETPLACE_TYPE_FILTER_LABELS = ['Letters', 'Numbers', 'Emojis'] as const

export const MARKETPLACE_STATUS_FILTER_LABELS = ['Listed', 'Premium', 'Available', 'Unlisted', 'Expiring Soon'] as const

export const MARKETPLACE_OFFERS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  'Has Offers': 'has_offers',
}

export const MARKETPLACE_STATUS_PARAM_OPTIONS: Record<string, string> = {
  Listed: 'listed',
  Available: 'available',
  Unlisted: 'unlisted',
  Premium: 'premium',
  'Expiring Soon': 'expiring',
}

export const MARKETPLACE_SORT_FILTERS = [
  'alphabetical',
  'most_favorited',
  'highest_last_sale',
  'price_low_to_high',
  'price_high_to_low',
]

export const OFFERS_STATUS_FILTER_LABELS = ['Listed', 'Has Offers'] as const

export const YOUR_DOMAINS_FILTER_LABELS = ['Listed', 'Expiring Soon'] as const

export const PORTFOLIO_ACTIVITY_FILTER_LABELS = ['Sale', 'Transfer', 'Offer', 'Mint', 'Listing'] as const

export const ALL_SORT_FILTERS = [
  'alphabetical',
  'alphabetical_desc',
  'most_favorited',
  'highest_last_sale',
  'lowest_last_sale',
  'price_low_to_high',
  'price_high_to_low',
  'highest_offer',
  'highest_offer_desc',
] as const

export const MARKETPLACE_CATEGORY_OBJECTS = [
  {
    category: 'Dictionary',
    subcategory: 'Adjectives',
  },
  {
    category: 'Dictionary',
    subcategory: 'Nouns',
  },
  {
    category: 'Dictionary',
    subcategory: 'Verbs',
  },
  {
    category: 'Names',
    subcategory: 'Female',
  },
  {
    category: 'Names',
    subcategory: 'Male',
  },
  {
    category: 'Characters',
    subcategory: 'Archetype',
  },
  {
    category: 'Characters',
    subcategory: 'Professions',
  },
  {
    category: 'Characters',
    subcategory: 'Comic',
  },
  {
    category: 'Characters',
    subcategory: 'Film',
  },
  {
    category: 'Characters',
    subcategory: 'Game',
  },
  {
    category: 'Characters',
    subcategory: 'Literature',
  },
  {
    category: 'Characters',
    subcategory: 'Mythology',
  },
  {
    category: 'Crypto',
    subcategory: 'Defi',
  },
  {
    category: 'Crypto',
    subcategory: 'Exchanges',
  },
  {
    category: 'Crypto',
    subcategory: 'Metaverse',
  },
  {
    category: 'Crypto',
    subcategory: 'Scaling',
  },
  {
    category: 'Crypto',
    subcategory: 'Tickers',
  },
  {
    category: 'Crypto',
    subcategory: 'General',
  },
  {
    category: 'Crypto',
    subcategory: 'Research',
  },
  {
    category: 'Crypto',
    subcategory: 'Protocol',
  },
  {
    category: 'Creatures',
    subcategory: 'Fantasy',
  },
  {
    category: 'Creatures',
    subcategory: 'Pokemon',
  },
  {
    category: 'Creatures',
    subcategory: 'Sci-Fi',
  },
  {
    category: 'Animals',
    subcategory: 'Bird',
  },
  {
    category: 'Animals',
    subcategory: 'Fish',
  },
  {
    category: 'Animals',
    subcategory: 'Mammal',
  },
  {
    category: 'Animals',
    subcategory: 'Insect',
  },
  {
    category: 'Animals',
    subcategory: 'Reptile',
  },
  {
    category: 'Animals',
    subcategory: 'Dinosaur',
  },
  {
    category: 'Misc',
    subcategory: 'Materials',
  },
  {
    category: 'Misc',
    subcategory: 'Collective',
  },
  {
    category: 'Misc',
    subcategory: 'Objects',
  },
  {
    category: 'Misc',
    subcategory: 'Food',
  },
  {
    category: 'Web',
    subcategory: 'Meme',
  },
  {
    category: 'Web',
    subcategory: 'Slang',
  },
  {
    category: 'Web',
    subcategory: 'Subreddit',
  },
  {
    category: 'Web',
    subcategory: 'Website',
  },
  {
    category: 'Places',
    subcategory: 'Country',
  },
  {
    category: 'Places',
    subcategory: 'Cities',
  },
  {
    category: 'Places',
    subcategory: 'POI',
  },
] as const

export const MARKETPLACE_CATEGORIES = [
  'Dictionary',
  'Names',
  'Characters',
  'Crypto',
  'Creatures',
  'Animals',
  'Misc',
  'Web',
  'Places',
]

export const MARKETPLACE_SUBCATEGORIES: string[] = MARKETPLACE_CATEGORY_OBJECTS.map((c) => c.subcategory)
