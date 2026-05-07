'use client'

import { motion } from 'motion/react'
import { TESTEMONIAL_QUOTES } from '@/constants/ui/testemonials'
import User from '@/components/ui/user'
import { Address } from 'viem'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

const ProSocialProof = () => {
  const displayed = TESTEMONIAL_QUOTES.slice(0, 7)

  return (
    <section className='border-tertiary/50 bg-background relative z-10 flex w-full flex-col items-center gap-6 border-y px-4 py-10 sm:py-14'>
      <p className='text-neutral text-center text-lg font-semibold tracking-widest uppercase'>
        Trusted by top ENS collectors
      </p>
      <motion.div
        variants={containerVariants}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-50px' }}
        className='flex flex-wrap items-center justify-center gap-3 sm:gap-4'
      >
        {displayed.map((t) => (
          <motion.div key={t.address} variants={itemVariants} className=''>
            <User
              address={t.address as Address}
              className='h-10 w-full gap-2 px-2 py-1'
              wrapperClassName='max-w-full'
              avatarSize='28px'
              fontSize='14px'
            />
          </motion.div>
        ))}
      </motion.div>
      <div className='flex items-center gap-2'>
        <div className='flex -space-x-4'>
          {displayed.slice(0, 6).map((t, i) => (
            <div
              key={t.address}
              className='border-background h-8 w-8 overflow-hidden rounded-full border-2'
              style={{ zIndex: 4 - i }}
            >
              <User
                address={t.address as Address}
                className='h-8 w-8'
                wrapperClassName='h-8 w-8'
                avatarSize='28px'
                fontSize='0px'
              />
            </div>
          ))}
        </div>
        <span className='text-neutral text-lg font-medium'>+752 happy domainers</span>
      </div>
    </section>
  )
}

export default ProSocialProof
