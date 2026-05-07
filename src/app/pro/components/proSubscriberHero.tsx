'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
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
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 180])
  const starsY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const shootingStarsY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 80])

  const tierName = TIER_LABELS[tierId] ?? 'Free'
  const tierColor = TIER_COLORS[tierId] ?? 'text-neutral'

  const isExpired = tierExpiresAt ? new Date(tierExpiresAt) < new Date() : false
  const daysLeft = tierExpiresAt
    ? Math.max(0, Math.ceil((new Date(tierExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  return (
    <section ref={sectionRef} className='relative h-[150vh] overflow-hidden'>
      <motion.div
        variants={glowVariants}
        animate='animate'
        style={{ y: glowY }}
        className='background-radial-primary absolute top-[35vh] left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2'
      />

      <motion.div style={{ y: starsY }} className='absolute inset-x-0 top-0 z-0 h-[115vh]'>
        <StarsBackground />
      </motion.div>

      <motion.div style={{ y: shootingStarsY }} className='absolute inset-x-0 top-0 z-0 h-[115vh]'>
        <ShootingStars />
      </motion.div>

      <div className='sticky top-0 z-10 flex h-screen items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32'>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
          style={{ y: contentY }}
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
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  isExpired ? 'bg-red-400' : 'bg-green-400 animate-pulse'
                )}
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
            <div className='mt-4 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-neutral'>
              {daysLeft === 0
                ? 'Expires today'
                : daysLeft === 1
                  ? 'Expires tomorrow'
                  : `${daysLeft} days remaining`}
            </div>
          )}

          {isExpired && (
            <div className='mt-4 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-sm font-medium text-red-400'>
              Your subscription has expired. Renew to regain access.
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}

export default ProSubscriberHero
