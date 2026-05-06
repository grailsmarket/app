'use client'

import React, { useEffect, useId, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { openUpgradeModalWithTier } from '@/state/reducers/modals/upgradeModal'
import { useClickAway } from '@/hooks/useClickAway'
import { Cross } from 'ethereum-identity-kit'
import { PRO_FEATURES, TIER_LABELS, TIER_COLORS, TIER_BORDER_COLORS, TIER_BG_COLORS } from './proSubscriberData'
import lockIcon from 'public/icons/alert-circle.svg'
import checkIcon from 'public/icons/check-circle.svg'
import Link from 'next/link'

interface ProSubscriberFeaturesProps {
  userTierId: number
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
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

const ProSubscriberFeatures = ({ userTierId }: ProSubscriberFeaturesProps) => {
  const dispatch = useAppDispatch()
  const [active, setActive] = useState<(typeof PRO_FEATURES)[number] | null>(null)
  const ref = useClickAway<HTMLDivElement>(() => setActive(null))
  const id = useId()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null)
      }
    }

    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active])

  const accessibleFeatures = PRO_FEATURES.filter((f) => f.minTierId <= userTierId)
  const lockedFeatures = PRO_FEATURES.filter((f) => f.minTierId > userTierId)

  const renderFeatureCard = (feature: (typeof PRO_FEATURES)[number], isAccessible: boolean) => {
    const requiredTierName = TIER_LABELS[feature.minTierId]
    const requiredTierColor = TIER_COLORS[feature.minTierId]
    const requiredBorderColor = TIER_BORDER_COLORS[feature.minTierId]
    const requiredBgColor = TIER_BG_COLORS[feature.minTierId]

    return (
      <motion.div
        key={feature.id}
        variants={cardVariants}
        layoutId={`card-${feature.id}-${id}`}
        onClick={() => setActive(feature)}
        className={cn(
          'group relative flex cursor-pointer flex-col gap-4 rounded-xl border-2 p-5 transition-all duration-300 sm:p-6',
          isAccessible
            ? cn('border-tertiary/60 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/60')
            : cn('border-tertiary/30 bg-secondary/10 opacity-70 hover:opacity-90')
        )}
      >
        <div className='flex items-start justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <motion.div
              layoutId={`icon-${feature.id}-${id}`}
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg',
                isAccessible ? 'bg-white/10' : 'bg-white/5'
              )}
            >
              <Image src={feature.icon} alt={feature.name} width={22} height={22} />
            </motion.div>
            <div className='flex flex-col'>
              <motion.h3
                layoutId={`title-${feature.id}-${id}`}
                className={cn('text-lg font-bold', !isAccessible && 'text-neutral/80')}
              >
                {feature.name}
              </motion.h3>
              <motion.p layoutId={`desc-${feature.id}-${id}`} className='text-neutral text-sm font-medium'>
                {feature.shortDescription}
              </motion.p>
            </div>
          </div>

          {isAccessible ? (
            <span className='flex shrink-0 items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-bold text-green-400'>
              <Image src={checkIcon} alt='Available' width={14} height={14} />
              Available
            </span>
          ) : (
            <span className='flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400'>
              <Image src={lockIcon} alt='Locked' width={14} height={14} />
              Locked
            </span>
          )}
        </div>

        <p
          className={cn(
            'text-sm leading-relaxed',
            isAccessible ? 'text-neutral/90' : 'text-neutral/60'
          )}
        >
          {feature.longDescription}
        </p>

        <div className='mt-auto flex flex-wrap items-center gap-3 pt-1'>
          {!isAccessible && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                dispatch(openUpgradeModalWithTier(feature.minTierId))
              }}
              className={cn(
                'cursor-pointer rounded border-2 px-3 py-1.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]',
                requiredBorderColor,
                requiredBgColor,
                requiredTierColor,
                'hover:bg-white/5'
              )}
            >
              Unlock with {requiredTierName}
            </button>
          )}

          {isAccessible && feature.link && (
            <Link
              href={feature.link}
              onClick={(e) => e.stopPropagation()}
              className='text-primary hover:text-primary/80 text-sm font-semibold transition-colors'
            >
              {feature.linkLabel} →
            </Link>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-20 h-full w-full bg-black/40 backdrop-blur-sm'
            onClick={() => setActive(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <div className='fixed inset-0 z-100 grid place-items-center px-4'>
            <motion.button
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className='absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary transition-colors cursor-pointer z-[101]'
              onClick={() => setActive(null)}
            >
              <Cross className='h-auto w-5' />
            </motion.button>

            <motion.div
              layoutId={`card-${active.id}-${id}`}
              ref={ref}
              className='dark:bg-background flex h-fit w-full max-w-[560px] flex-col overflow-hidden rounded-xl bg-secondary border-2 border-tertiary/60 shadow-xl'
            >
              <div className='flex items-center gap-4 border-b border-tertiary/40 p-5 sm:p-6'>
                <motion.div
                  layoutId={`icon-${active.id}-${id}`}
                  className='flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10'
                >
                  <Image src={active.icon} alt={active.name} width={28} height={28} />
                </motion.div>
                <div className='flex flex-col'>
                  <motion.h3
                    layoutId={`title-${active.id}-${id}`}
                    className='text-xl font-bold'
                  >
                    {active.name}
                  </motion.h3>
                  <motion.p layoutId={`desc-${active.id}-${id}`} className='text-neutral text-sm font-medium'>
                    {active.shortDescription}
                  </motion.p>
                </div>
              </div>

              <div className='flex flex-col gap-4 p-5 sm:p-6'>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className='text-sm leading-relaxed text-neutral/90'
                >
                  {active.modalDescription}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className='flex flex-wrap items-center gap-3 pt-2'
                >
                  {active.minTierId <= userTierId ? (
                    <>
                      <span className='flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1.5 text-sm font-bold text-green-400'>
                        <Image src={checkIcon} alt='' width={14} height={14} />
                        Included in your plan
                      </span>
                      {active.link && (
                        <Link
                          href={active.link}
                          className='text-primary hover:text-primary/80 text-sm font-semibold transition-colors'
                        >
                          {active.linkLabel} →
                        </Link>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => dispatch(openUpgradeModalWithTier(active.minTierId))}
                      className={cn(
                        'cursor-pointer rounded border-2 px-4 py-2 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]',
                        TIER_BORDER_COLORS[active.minTierId],
                        TIER_BG_COLORS[active.minTierId],
                        TIER_COLORS[active.minTierId],
                        'hover:bg-white/5'
                      )}
                    >
                      Upgrade to {TIER_LABELS[active.minTierId]} to unlock
                    </button>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className='flex w-full flex-col gap-14 sm:gap-20'>
        {accessibleFeatures.length > 0 && (
          <section className='flex flex-col gap-8'>
            <div className='flex items-center gap-3'>
              <div className='bg-green-500/20 flex h-8 w-8 items-center justify-center rounded-full'>
                <Image src={checkIcon} alt='' width={16} height={16} />
              </div>
              <h2 className='font-sedan-sc text-3xl sm:text-4xl'>
                Your <span className='text-primary'>Features</span>
              </h2>
              <span className='text-neutral ml-2 text-sm font-medium'>
                {accessibleFeatures.length} available
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: '-60px' }}
              className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
            >
              {accessibleFeatures.map((feature) => renderFeatureCard(feature, true))}
            </motion.div>
          </section>
        )}

        {lockedFeatures.length > 0 && (
          <section className='flex flex-col gap-8'>
            <div className='flex items-center gap-3'>
              <div className='bg-red-500/20 flex h-8 w-8 items-center justify-center rounded-full'>
                <Image src={lockIcon} alt='' width={16} height={16} />
              </div>
              <h2 className='font-sedan-sc text-3xl sm:text-4xl'>
                Unlock <span className='text-primary'>More</span>
              </h2>
              <span className='text-neutral ml-2 text-sm font-medium'>
                {lockedFeatures.length} locked
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial='hidden'
              whileInView='visible'
              viewport={{ once: true, margin: '-60px' }}
              className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
            >
              {lockedFeatures.map((feature) => renderFeatureCard(feature, false))}
            </motion.div>
          </section>
        )}
      </div>
    </>
  )
}

export default ProSubscriberFeatures
