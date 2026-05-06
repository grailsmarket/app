'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'motion/react'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { openUpgradeModalWithTier } from '@/state/reducers/modals/upgradeModal'
import register from 'public/icons/registration-primary.svg'
import search from 'public/icons/search-primary.svg'
import grid from 'public/icons/grid-primary.svg'
import watchlist from 'public/icons/watchlist-primary.svg'
import message from 'public/icons/chat.svg'
import notification from 'public/icons/bell-primary.svg'
import view from 'public/icons/view-primary.svg'
import grailsAI from 'public/icons/grails-ai.svg'

const features = [
  {
    title: 'Bulk Offers',
    description: 'Create offers on hundreds of names in a single flow. Save gas and time.',
    icon: register,
    iconSize: 24,
    tier: 'Plus',
  },
  {
    title: 'Google Metrics Filters',
    description: 'Filter and sort by search volume, CPC, and competition data.',
    icon: search,
    iconSize: 20,
    tier: 'Plus',
  },
  {
    title: 'Custom Dashboard',
    description: 'Build your own command center with widgets tailored to your strategy.',
    icon: grid,
    iconSize: 20,
    tier: 'Pro',
  },
  {
    title: 'Multiple Watchlists',
    description: 'Track unlimited names across themed watchlists with real-time alerts.',
    icon: watchlist,
    iconSize: 24,
    tier: 'Pro',
  },
  {
    title: 'Private Chat Group',
    description: 'Join the exclusive Grails Pro chat with the biggest names in ENS.',
    icon: message,
    iconSize: 20,
    tier: 'Gold',
  },
  {
    title: 'Feature Notifications',
    description: 'Be the first to access new tools, categories, and market features.',
    icon: notification,
    iconSize: 20,
    tier: 'Plus',
  },
  {
    title: 'Profile & Name Analytics',
    description: 'See exactly who views your profile and name pages, and when.',
    icon: view,
    iconSize: 20,
    tier: 'Pro',
  },
  {
    title: 'AI Search Recommendations',
    description: 'Let our AI analyze your history and market trends to surface hidden gems.',
    icon: grailsAI,
    iconSize: 20,
    tier: 'Pro',
  },
]

const tierBadgeStyle: Record<string, string> = {
  Plus: 'bg-white/10 text-white border-white/20',
  Pro: 'bg-primary/15 text-primary border-primary/30',
  Gold: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

const ProFeatures = () => {
  const dispatch = useAppDispatch()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <section className='flex w-full flex-col items-center gap-10 sm:gap-14'>
      <div className='flex max-w-3xl flex-col items-center gap-4 text-center'>
        <h2 className='font-sedan-sc text-4xl sm:text-5xl md:text-6xl'>
          Tools Built for <span className='text-primary'>Serious</span> Domainers
        </h2>
        <p className='text-neutral max-w-xl text-lg sm:text-xl'>
          Every feature is designed to give you an edge in the ENS market. From bulk operations to AI-powered insights.
        </p>
      </div>

      <motion.div
        variants={containerVariants}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-80px' }}
        className='grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
      >
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            variants={cardVariants}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              'group relative flex flex-col gap-4 rounded-lg border-2 p-5 transition-all duration-300',
              'border-tertiary bg-secondary/40 hover:border-primary/50 hover:bg-secondary',
              hoveredIndex !== null && hoveredIndex !== i && 'opacity-60'
            )}
          >
            <div className='flex items-center justify-between'>
              <div className='flex h-10 w-10 items-center justify-center rounded-md bg-white/5'>
                <Image src={feature.icon} alt={feature.title} width={feature.iconSize} height={feature.iconSize} />
              </div>
              <span
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase',
                  tierBadgeStyle[feature.tier]
                )}
              >
                {feature.tier}
              </span>
            </div>
            <div className='flex flex-col gap-1.5'>
              <h3 className='text-lg font-bold'>{feature.title}</h3>
              <p className='text-neutral text-sm leading-relaxed'>{feature.description}</p>
            </div>
            <div className='mt-auto pt-2'>
              <button
                onClick={() => {
                  const tierId = feature.tier === 'Plus' ? 1 : feature.tier === 'Pro' ? 2 : 3
                  dispatch(openUpgradeModalWithTier(tierId))
                }}
                className='text-primary hover:text-primary/80 text-sm font-semibold transition-colors'
              >
                Unlock with {feature.tier} →
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export default ProFeatures
