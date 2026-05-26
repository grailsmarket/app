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
  modalDescription: string
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
    modalDescription:
      'Your Grails Pro badge appears automatically on your profile page and avatar, letting everyone in the community know you are a premium subscriber. This subtle but powerful signal helps you build trust with potential buyers and sellers. The badge is updated in real-time and reflects your current subscription tier.',
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
    modalDescription:
      'Google Metrics integration pulls real search data directly into Grails. You can filter the marketplace by monthly search volume to find names people actually look for, sort by CPC to identify commercial value, and use competition scores to spot undervalued gems. This data updates regularly and covers millions of search terms.',
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
    modalDescription:
      'The Bulk Offers tool lets you select any number of names from your watchlist or search results and send offers to all owners in one flow. You set a base offer percentage or fixed amount, then fine-tune individual offers before confirming. All transactions are batched to save gas and time.',
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
    modalDescription:
      'N-of-many offers let you approach a seller with a collection of names and say: I will buy any 5 of these 20 names at the offered price. The seller picks which ones to sell, giving them flexibility while you secure names you want without committing to the entire lot. A game-changer for portfolio acquisitions.',
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
    modalDescription:
      'Connect your Telegram account to Grails and receive instant alerts for the events you care about. Choose from new listings in your watchlists, price drops on tracked names, offers received, sales completed, and more. Messages include direct links so you can act in seconds from your phone.',
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
    modalDescription:
      'As a Pro subscriber, you get early access to every new feature before it goes public. This includes beta tools, new marketplace categories, experimental analytics, and UI improvements. Your feedback directly shapes what gets built next, and you can report bugs or suggest changes through a private channel.',
    icon: bellIcon,
    minTierId: 1,
  },
  {
    id: 'featured-listings',
    name: 'Featured Listings Boost',
    shortDescription: 'Your listings appear in the Featured Listings section',
    longDescription:
      'Get maximum visibility for your listings. Pro subscriber listings are automatically eligible for the Featured Listings section on the homepage, putting your names in front of thousands of potential buyers.',
    modalDescription:
      'When you list a name for sale, it becomes eligible for the Featured Listings carousel on the Grails homepage. This premium placement puts your names in front of every visitor to the site, dramatically increasing visibility and the chance of a quick sale. Featured listings rotate to ensure fairness.',
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
    modalDescription:
      'Your dashboard is a fully customizable workspace. Drag and drop widgets to arrange them however you like. Available widgets include portfolio value charts, recent sales, trending names, watchlist summaries, activity feeds, and more. Save multiple layouts and switch between them depending on your current focus.',
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
    modalDescription:
      'Instead of one generic watchlist, create unlimited themed lists. Separate your short-digit names from your dictionary words, track premium emoji domains in their own list, and monitor expiring names separately. Each watchlist has independent alerts, sorting, and filtering so you never miss an opportunity.',
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
    modalDescription:
      'Profile View Analytics shows you a complete log of who has visited your profile, when they visited, and how many times. Identify potential buyers who keep checking your listings, spot whales sizing you up, and understand your personal brand reach in the ENS ecosystem. Data is updated in real-time.',
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
    modalDescription:
      'Name Page Analytics gives you per-name insights. See which of your names are getting the most attention, who is looking at them, and whether views are trending up or down. Use this data to time your listings, adjust prices, and identify which names in your portfolio have the highest market demand.',
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
    modalDescription:
      'Our AI recommendation engine learns from your search patterns, watchlist behavior, and market-wide trends to suggest names you might love. It identifies patterns in your preferences and finds similar undervalued names. The model improves continuously as the ENS market evolves and as you interact with the platform.',
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
    modalDescription:
      'Saved Searches let you bookmark any filter and sort combination with one click. Whether it is 3-letter names under 1 ETH, emoji domains expiring soon, or dictionary words with high CPC, your configurations are always one click away. You can also set alerts on saved searches to get notified when new matching names appear.',
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
    modalDescription:
      'Priority Support means your questions and issues jump to the front of the line. Whether it is a bug report, a feature suggestion, or help with a tricky transaction, our team responds within hours, not days. Pro and Gold subscribers also get access to a private Discord support channel for real-time help.',
    icon: supportIcon,
    minTierId: 2,
  },
  {
    id: 'sponsorship',
    name: 'Sponsorship Page Feature',
    shortDescription: 'Get your name featured on the sponsorship page',
    longDescription:
      'Gain premium exposure by getting your name or brand featured on the Grails sponsorship page. This optional perk puts you in front of the entire Grails community and signals your status as a top-tier supporter.',
    modalDescription:
      'The Grails Sponsorship Page highlights top supporters and partners of the platform. As a Gold or Patron subscriber, you can optionally feature your primary ENS name or brand logo here. This is permanent visibility for as long as you maintain your subscription, viewed by thousands of collectors monthly.',
    icon: badgeIcon,
    minTierId: 3,
  },
  {
    id: 'private-chat',
    name: 'Private Chat Group',
    shortDescription: 'Exclusive chat with top ENS collectors',
    longDescription:
      'Join the most exclusive room in ENS. The Grails Gold private chat is where the biggest whales, most active traders, and smartest collectors share alpha, discuss strategy, and build relationships. Invitation-only access.',
    modalDescription:
      'The Grails Gold Private Chat is an invitation-only Telegram group where the biggest names in ENS share alpha, discuss market trends, and build relationships. This is where six-figure deals get discussed before they hit the public market. Access is strictly limited to Gold and Patron subscribers.',
    icon: chatIcon,
    minTierId: 3,
  },
  {
    id: 'video-chat',
    name: 'Monthly Video Chat with Team',
    shortDescription: 'Direct monthly call with the Grails core team',
    longDescription:
      'Get unprecedented access to the people building Grails. Monthly private video calls where you can discuss the roadmap, suggest features, report issues directly, and influence the direction of the platform. Your feedback goes straight to the top.',
    modalDescription:
      'Patron subscribers get a monthly private video call with the Grails founders and core engineering team. Discuss the product roadmap, pitch new features, report issues with direct follow-up, and get early previews of what is being built. Your input directly shapes the future of the platform.',
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
