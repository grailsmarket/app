'use client'

import { motion } from 'motion/react'
import { cn } from '@/utils/tailwind'
import { TIER_LABELS, TIER_COLORS } from './proSubscriberData'
import ShootingStars from '@/components/ui/shootingStars'
import StarsBackground from '@/components/ui/starsBackground'
import { glowVariants } from './proHero'

interface ProSubscriberHeroProps {
  tierId: number
  tierExpiresAt: string | null
}

const ProSubscriberHero = ({ tierId, tierExpiresAt }: ProSubscriberHeroProps) => {
  const tierName = TIER_LABELS[tierId] ?? 'Free'
  const tierColor = TIER_COLORS[tierId] ?? 'text-neutral'

  const isExpired = tierExpiresAt ? new Date(tierExpiresAt) < new Date() : false
  const daysLeft = tierExpiresAt
    ? Math.max(0, Math.ceil((new Date(tierExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <section className='border-tertiary/50 relative h-[calc(100vh-56px)] overflow-hidden border-b-2 md:h-[calc(100vh-70px)]'>
      <motion.div
        variants={glowVariants}
        animate='animate'
        className='background-radial-primary absolute top-[50vh] left-1/2 h-[600px] w-screen -translate-x-1/2 -translate-y-1/2 sm:w-[600px]'
      />

      <div className='z-10 flex h-full items-center justify-center px-4 py-16 sm:pt-32 sm:pb-24 md:pb-32'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          className='flex max-w-3xl flex-col items-center text-center'
        >
          <div className='mb-4'>
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold tracking-wide uppercase',
                tierId === 1 && 'border-white/30 bg-white/10 text-white',
                tierId === 2 && 'border-primary/30 bg-primary/10 text-primary',
                tierId === 3 && 'border-amber-500/30 bg-amber-500/10 text-amber-500',
                tierId === 4 && 'border-purple-400/30 bg-purple-400/10 text-purple-400'
              )}
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', isExpired ? 'bg-red-400' : 'animate-pulse bg-green-400')}
              />
              {isExpired ? 'Expired' : 'Active'} {tierName} Plan
            </span>
          </div>

          <h1 className='font-sedan-sc text-4xl leading-tight sm:text-5xl md:text-6xl lg:text-7xl'>
            See what you can do
            <br />
            with Grails <span className={tierColor}>{tierName}</span>
          </h1>

          <p className='text-neutral mt-4 max-w-xl text-lg sm:text-xl'>
            Explore every feature included in your subscription. Unlock more power by upgrading to a higher tier.
          </p>

          {daysLeft != null && !isExpired && (
            <div className='bg-secondary text-neutral mt-4 rounded-full px-4 py-1.5 text-sm font-medium'>
              {daysLeft === 0 ? 'Expires today' : daysLeft === 1 ? 'Expires tomorrow' : `${daysLeft} days remaining`}
            </div>
          )}

          {isExpired && (
            <div className='mt-4 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400'>
              Your subscription has expired. Renew to regain access.
            </div>
          )}
        </motion.div>
      </div>

      <div className='fixed inset-x-0 top-0 h-full w-screen overflow-hidden'>
        <StarsBackground />
        <ShootingStars />
      </div>
    </section>
  )
}

export default ProSubscriberHero
