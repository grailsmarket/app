'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import ShootingStars from '@/components/ui/shootingStars'
import StarsBackground from '@/components/ui/starsBackground'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export const glowVariants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 0.7, 0.5],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
}

const ProHero = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 220])
  const starsY = useTransform(scrollYProgress, [0, 1], [0, 120])
  const shootingStarsY = useTransform(scrollYProgress, [0, 1], [0, 200])
  const glowY = useTransform(scrollYProgress, [0, 1], [0, 80])

  const scrollToPricing = () => {
    const el = document.getElementById('pricing')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className='relative h-[150vh] overflow-hidden'>
      <motion.div
        variants={glowVariants}
        animate='animate'
        style={{ y: glowY }}
        className='background-radial-primary absolute top-[35vh] left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 md:h-[800px] md:w-[800px]'
      />

      <motion.div style={{ y: starsY }} className='absolute inset-x-0 top-0 z-0 h-[115vh]'>
        <StarsBackground />
      </motion.div>

      <motion.div style={{ y: shootingStarsY }} className='absolute inset-x-0 top-0 z-0 h-[115vh]'>
        <ShootingStars />
      </motion.div>

      <div className='sticky top-0 z-10 flex h-screen items-center justify-center px-4 pt-24 pb-16 sm:pt-32 sm:pb-24 md:pt-40 md:pb-32'>
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          style={{ y: contentY }}
          className='flex max-w-4xl flex-col items-center text-center'
        >
          <motion.h1
            variants={itemVariants}
            className='font-sedan-sc text-5xl leading-tight sm:text-7xl md:text-8xl lg:text-9xl'
          >
            Unlock Your
            <br />
            <span className='text-primary'>Full Potential</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className='text-neutral mt-6 max-w-2xl text-lg leading-relaxed sm:text-xl md:text-2xl'
          >
            Supercharge your ENS domaining with premium analytics, bulk tools, AI recommendations, and exclusive access
            built for serious collectors.
          </motion.p>

          <motion.div variants={itemVariants} className='mt-10 flex flex-col items-center gap-6'>
            <button
              onClick={scrollToPricing}
              className='bg-primary text-background hover:bg-primary/90 cursor-pointer rounded-sm px-8 py-3.5 text-xl font-bold transition-all hover:scale-105 active:scale-95'
            >
              Get Grails Pro
            </button>
            <span className='text-neutral text-sm font-medium'>No credit card required to explore</span>
          </motion.div>

          <motion.div variants={itemVariants} className='text-md text-neutral/80 mt-8 flex items-center gap-6'>
            <div className='flex items-center gap-2'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                className='text-green-400'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
              <span>Cancel anytime</span>
            </div>
            <div className='flex items-center gap-2'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                className='text-green-400'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
              <span>Pay with ETH</span>
            </div>
            <div className='flex items-center gap-2'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                className='text-green-400'
              >
                <polyline points='20 6 9 17 4 12' />
              </svg>
              <span>Instant access</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className='absolute bottom-6 left-1/2 -translate-x-1/2'
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className='border-neutral/30 flex h-10 w-6 items-start justify-center rounded-full border-2 pt-2'
        >
          <div className='bg-neutral h-1.5 w-1.5 rounded-full' />
        </motion.div>
      </motion.div>
    </section>
  )
}

export default ProHero
