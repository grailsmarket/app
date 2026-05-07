'use client'

import { motion } from 'motion/react'
import { useAppDispatch } from '@/state/hooks'
import { openUpgradeModalWithTier } from '@/state/reducers/modals/upgradeModal'
import ShootingStars from '@/components/ui/shootingStars'
import StarsBackground from '@/components/ui/starsBackground'

const ProCta = () => {
  const dispatch = useAppDispatch()

  return (
    <section className='border-primary/20 relative flex w-full flex-col items-center gap-6 overflow-hidden rounded-2xl border-2 px-6 py-16 text-center sm:py-20 md:py-24'>
      <div className='background-radial-primary absolute inset-0 h-full w-full' />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className='relative z-10 flex max-w-2xl flex-col items-center gap-5'
      >
        <h2 className='font-sedan-sc text-4xl sm:text-5xl md:text-6xl'>
          Ready to Dominate <span className='text-primary'>ENS</span>?
        </h2>
        <p className='text-neutral max-w-lg text-lg sm:text-xl'>
          Join thousands of domainers who have already unlocked their edge. Your next great name is waiting.
        </p>
        <div className='mt-2 flex flex-col items-center gap-4 sm:flex-row'>
          <button
            onClick={() => dispatch(openUpgradeModalWithTier(2))}
            className='bg-primary text-background hover:bg-primary/90 cursor-pointer rounded-sm px-8 py-3.5 text-lg font-bold transition-all hover:scale-105 active:scale-95'
          >
            Get Grails Pro
          </button>
          <button
            onClick={() => dispatch(openUpgradeModalWithTier(1))}
            className='border-tertiary cursor-pointer rounded-sm border-2 px-8 py-3.5 text-lg font-semibold transition-colors hover:border-white/40'
          >
            Start with Plus
          </button>
        </div>
        <p className='text-neutral/60 text-md'>Cancel anytime. No hidden fees.</p>
      </motion.div>
      <ShootingStars />
      <StarsBackground />
    </section>
  )
}

export default ProCta
