import { StaticImageData } from 'next/image'
import badgeIcon from 'public/icons/star.svg'
import searchIcon from 'public/icons/search-primary.svg'
import bulkIcon from 'public/icons/registration-primary.svg'
import bellIcon from 'public/icons/bell-primary.svg'
import tagIcon from 'public/icons/tag.svg'
import gridIcon from 'public/icons/grid-primary.svg'
import watchlistIcon from 'public/icons/watchlist-primary.svg'
import viewIcon from 'public/icons/view-primary.svg'
import aiIcon from 'public/icons/grails-ai.svg'
import filterIcon from 'public/icons/filter.svg'
import supportIcon from 'public/icons/check-circle.svg'
import chatIcon from 'public/icons/chat.svg'
import videoIcon from 'public/icons/connected.svg'

export interface ProFeature {
  id: string
  name: string
  shortDescription: string
  longDescription: string
  icon: StaticImageData
  minTierId: number
  link?: string
  linkLabel?: string
}

export const PRO_FEATURES: ProFeature[] = [
  {
    id: 'profile-badge',
    name: 'Profile Badge',
    shortDescription: 'Badge on profile and avatar/header',
    longDescription:
      'Stand out in the community with an exclusive Grails Pro badge displayed on your profile and avatar. Your status is instantly visible to other collectors, signaling that you are a serious player in the ENS space.',
    icon: badgeIcon,
    minTierId: 1,
    link: '/profile',
    linkLabel: 'View your profile',
  },
  {
    id: 'google-metrics',
    name: 'Google Metrics Filters',
    shortDescription: 'Filter and sort names by search volume, CPC, and competition data',
    longDescription:
      'Make data-driven decisions with built-in Google search metrics. Filter and sort ENS names by monthly search volume, cost-per-click (CPC), and competition scores. Discover undervalued names that real people are actually searching for.',
    icon: searchIcon,
    minTierId: 1,
    link: '/categories',
    linkLabel: 'Explore categories',
  },
  {
    id: 'bulk-offers',
    name: 'Bulk Offers',
    shortDescription: 'Create offers on multiple names at once',
    longDescription:
      'Save hours of manual work by creating offers on hundreds of names in a single transaction. Set base prices and tweak individual amounts. Perfect for domainers who operate at scale.',
    icon: bulkIcon,
    minTierId: 1,
    link: '/profile',
    linkLabel: 'Make bulk offers',
  },
  {
    id: 'n-of-many-offers',
    name: 'N-of-Many Bulk Offers',
    shortDescription: 'Create conditional offers where only N out of many need to be accepted',
    longDescription:
      'Take bulk offers to the next level with N-of-many logic. Create an offer on a large portfolio where only a subset needs to be accepted for the deal to go through. Gives sellers flexibility while protecting your capital.',
    icon: bulkIcon,
    minTierId: 1,
    link: '/profile',
    linkLabel: 'Make bulk offers',
  },
  {
    id: 'telegram-notifications',
    name: 'Telegram Notifications',
    shortDescription: 'Real-time alerts sent to your Telegram',
    longDescription:
      'Never miss a beat. Get instant Telegram notifications for new listings, price drops, offers on your names, and watchlist activity. Configure exactly what you want to be notified about and stay ahead of the market.',
    icon: bellIcon,
    minTierId: 1,
    link: '/profile',
    linkLabel: 'Configure notifications',
  },
  {
    id: 'early-access',
    name: 'Early Feature Access',
    shortDescription: 'Be the first to try new tools and categories',
    longDescription:
      'Get a head start on every new feature, tool, and category before the public launch. Test beta functionality, provide feedback, and shape the future of Grails. Your voice matters in our product roadmap.',
    icon: bellIcon,
    minTierId: 1,
  },
  {
    id: 'featured-listings',
    name: 'Featured Listings Boost',
    shortDescription: 'Your listings appear in the Featured Listings section',
    longDescription:
      'Get maximum visibility for your listings. Pro subscriber listings are automatically eligible for the Featured Listings section on the homepage, putting your names in front of thousands of potential buyers.',
    icon: tagIcon,
    minTierId: 1,
    link: '/marketplace',
    linkLabel: 'View marketplace',
  },
  {
    id: 'custom-dashboard',
    name: 'Customizable Dashboard',
    shortDescription: 'Build your own command center with widgets',
    longDescription:
      'Design a personal dashboard tailored to your strategy. Add, remove, and rearrange widgets to track the metrics that matter most to you. From price charts to recent activity, build the perfect overview of your ENS portfolio.',
    icon: gridIcon,
    minTierId: 2,
    link: '/dashboard',
    linkLabel: 'Open dashboard',
  },
  {
    id: 'multiple-watchlists',
    name: 'Multiple Watchlists',
    shortDescription: 'Create unlimited themed watchlists',
    longDescription:
      'Organize your interests into unlimited themed watchlists. Create separate lists for short domains, emoji names, dictionary words, or any category you choose. Each watchlist gets its own real-time alerts and activity feed.',
    icon: watchlistIcon,
    minTierId: 2,
    link: '/profile',
    linkLabel: 'Manage watchlists',
  },
  {
    id: 'profile-views',
    name: 'Profile View Analytics',
    shortDescription: 'See exactly who viewed your profile and when',
    longDescription:
      'Gain insights into your personal brand. See which collectors, buyers, and sellers are checking out your profile. Understand your reach in the ENS community and identify potential trading partners.',
    icon: viewIcon,
    minTierId: 2,
    link: '/profile',
    linkLabel: 'View analytics',
  },
  {
    id: 'name-views',
    name: 'Name Page Analytics',
    shortDescription: 'Track views on your individual name pages',
    longDescription:
      'Get granular analytics on every name you own. See view counts, viewer identities, and engagement patterns for each individual ENS name page. Use this data to price your listings strategically and understand market demand.',
    icon: viewIcon,
    minTierId: 2,
    link: '/profile',
    linkLabel: 'View analytics',
  },
  {
    id: 'ai-recommendations',
    name: 'AI Search Recommendations',
    shortDescription: 'AI-powered search term suggestions based on your history',
    longDescription:
      'Let our AI analyze your search history, watchlist activity, and market trends to surface hidden gems you might have missed. The more you use Grails, the smarter the recommendations become. Discover your next great name before anyone else.',
    icon: aiIcon,
    minTierId: 2,
    link: '/ai-search',
    linkLabel: 'Try AI search',
  },
  {
    id: 'saved-searches',
    name: 'Saved Search / Filter / Sort',
    shortDescription: 'Save and replay your favorite search configurations',
    longDescription:
      'Never rebuild a search from scratch again. Save your most effective filter and sort combinations with a single click. Replay them instantly whenever you return to the marketplace. Perfect for monitoring specific niches and categories.',
    icon: filterIcon,
    minTierId: 2,
    link: '/categories',
    linkLabel: 'Browse categories',
  },
  {
    id: 'priority-support',
    name: 'Priority Support',
    shortDescription: 'Fast-track support from the Grails team',
    longDescription:
      'Skip the queue with priority access to our support team. Whether you have a technical issue, a feature request, or need help with a complex transaction, your tickets get handled first. Direct Discord channel access included.',
    icon: supportIcon,
    minTierId: 2,
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship Page Feature',
    shortDescription: 'Get your name featured on the sponsorship page',
    longDescription:
      'Gain premium exposure by getting your name or brand featured on the Grails sponsorship page. This optional perk puts you in front of the entire Grails community and signals your status as a top-tier supporter.',
    icon: badgeIcon,
    minTierId: 3,
  },
  {
    id: 'private-chat',
    name: 'Private Chat Group',
    shortDescription: 'Exclusive chat with top ENS collectors',
    longDescription:
      'Join the most exclusive room in ENS. The Grails Gold private chat is where the biggest whales, most active traders, and smartest collectors share alpha, discuss strategy, and build relationships. Invitation-only access.',
    icon: chatIcon,
    minTierId: 3,
  },
  {
    id: 'video-chat',
    name: 'Monthly Video Chat with Team',
    shortDescription: 'Direct monthly call with the Grails core team',
    longDescription:
      'Get unprecedented access to the people building Grails. Monthly private video calls where you can discuss the roadmap, suggest features, report issues directly, and influence the direction of the platform. Your feedback goes straight to the top.',
    icon: videoIcon,
    minTierId: 4,
  },
]

export const TIER_LABELS: Record<number, string> = {
  0: 'Free',
  1: 'Plus',
  2: 'Pro',
  3: 'Gold',
  4: 'Patron',
}

export const TIER_COLORS: Record<number, string> = {
  0: 'text-neutral',
  1: 'text-white',
  2: 'text-primary',
  3: 'text-amber-500',
  4: 'text-purple-400',
}

export const TIER_BORDER_COLORS: Record<number, string> = {
  0: 'border-neutral/30',
  1: 'border-white/30',
  2: 'border-primary/50',
  3: 'border-amber-500/40',
  4: 'border-purple-400/40',
}

export const TIER_BG_COLORS: Record<number, string> = {
  0: 'bg-neutral/5',
  1: 'bg-white/5',
  2: 'bg-primary/5',
  3: 'bg-amber-500/5',
  4: 'bg-purple-400/5',
}
