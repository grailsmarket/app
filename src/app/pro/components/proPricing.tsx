'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/utils/tailwind'
import { useAppDispatch } from '@/state/hooks'
import { openUpgradeModalWithTier } from '@/state/reducers/modals/upgradeModal'
import { Check } from 'ethereum-identity-kit'
import { TIER_LABELS } from './proSubscriberData'

const ANNUAL_DISCOUNT = 0.15

const formatPrice = (price: number) => {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const tiers = [
  {
    tierId: 1,
    name: 'Plus',
    tagline: 'For the curious collector',
    monthlyPrice: 19.99,
    color: 'text-white',
    borderColor: 'border-white/30',
    headerBg: 'bg-white/5',
    buttonStyle: 'border-white text-white hover:bg-white/10',
    buttonText: 'Start with Plus',
    features: [
      'Badge on profile & avatar',
      'Google Metrics Filter/Sort',
      'Bulk Offers',
      'n-of-many Bulk Offers',
      'Telegram notifications',
      'First access to new features',
      'Featured Listings boost',
    ],
  },
  {
    tierId: 2,
    name: 'Pro',
    tagline: 'For power domainers',
    monthlyPrice: 49.99,
    color: 'text-primary',
    borderColor: 'border-primary/50',
    headerBg: 'bg-primary/5',
    buttonStyle: 'border-primary text-primary hover:bg-primary/10',
    buttonText: 'Become Pro',
    popular: true,
    features: [
      'Everything in Plus',
      'Customizable Dashboard',
      'Multiple Watchlists',
      'Who viewed your Profile',
      'Who viewed your Name pages',
      'AI Recommendation page',
      'Saved Search/Filter/Sort',
      'Priority Support',
    ],
  },
  {
    tierId: 3,
    name: 'Gold',
    tagline: 'For whales & insiders',
    monthlyPrice: 99.99,
    color: 'text-amber-500',
    borderColor: 'border-amber-500/40',
    headerBg: 'bg-amber-500/5',
    buttonStyle: 'border-amber-500 text-amber-500 hover:bg-amber-500/10',
    buttonText: 'Get Gold',
    features: [
      'Everything in Pro',
      'Sponsorship page feature',
      'Private Chat group',
      'Direct team access',
      'Early beta invites',
      'Custom integrations',
    ],
  },
]

type BillingPeriod = 'monthly' | 'yearly'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

interface ProPricingProps {
  userTierId?: number
}

const ProPricing = ({ userTierId }: ProPricingProps) => {
  const dispatch = useAppDispatch()
  const [billing, setBilling] = useState<BillingPeriod>('monthly')
  const isYearly = billing === 'yearly'

  const getPrice = (monthly: number) => {
    if (isYearly) {
      return (monthly * 12 * (1 - ANNUAL_DISCOUNT)).toFixed(2)
    }
    return monthly.toFixed(2)
  }

  const getMonthlyEquivalent = (monthly: number) => {
    if (isYearly) {
      return ((monthly * 12 * (1 - ANNUAL_DISCOUNT)) / 12).toFixed(2)
    }
    return monthly.toFixed(2)
  }

  const isSubscriberView = userTierId != null && userTierId > 0

  return (
    <section className='flex w-full flex-col items-center gap-10 sm:gap-12'>
      <div className='flex max-w-3xl flex-col items-center gap-4 text-center'>
        <h2 className='font-sedan-sc text-4xl sm:text-5xl md:text-6xl'>
          {isSubscriberView ? 'Your Plan & ' : ''}Simple, Transparent <span className='text-primary'>Pricing</span>
        </h2>
        <p className='text-neutral max-w-xl text-lg sm:text-xl'>
          {isSubscriberView
            ? 'You are currently subscribed to the ' + TIER_LABELS[userTierId] + ' plan. Upgrade anytime to unlock more features.'
            : 'Choose the plan that fits your domaining strategy. Upgrade or cancel anytime.'}
        </p>
      </div>

      <div className='bg-secondary relative flex w-full max-w-sm rounded-full p-1'>
        <motion.div
          className='bg-primary absolute top-1 bottom-1 rounded-full'
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            width: 'calc(50% - 4px)',
            left: isYearly ? 'calc(50% + 2px)' : '4px',
          }}
        />
        <button
          onClick={() => setBilling('monthly')}
          className={cn(
            'relative z-10 w-1/2 py-2.5 text-center text-lg font-semibold transition-colors',
            !isYearly ? 'text-background' : 'text-neutral hover:text-white'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling('yearly')}
          className={cn(
            'relative z-10 flex w-1/2 items-center justify-center gap-2 py-2.5 text-center text-lg font-semibold transition-colors',
            isYearly ? 'text-background' : 'text-neutral hover:text-white'
          )}
        >
          Yearly
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-bold',
              isYearly ? 'bg-green-600/70 text-green-100' : 'bg-green-500/20 text-green-400'
            )}
          >
            SAVE 15%
          </span>
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial='hidden'
        whileInView='visible'
        viewport={{ once: true, margin: '-60px' }}
        className='grid w-full grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch'
      >
        {tiers.map((tier) => {
          const isCurrent = isSubscriberView && userTierId === tier.tierId
          const isUpgrade = isSubscriberView && userTierId != null && userTierId < tier.tierId
          const isLower = isSubscriberView && userTierId != null && userTierId > tier.tierId

          return (
            <motion.div
              key={tier.name}
              variants={cardVariants}
              className={cn(
                'relative flex flex-col rounded-xl border-2 p-6 sm:p-7',
                isCurrent
                  ? 'border-green-500/50 bg-green-500/5'
                  : tier.popular && !isSubscriberView
                    ? tier.borderColor
                    : 'border-tertiary/60',
                tier.popular && !isSubscriberView && 'bg-primary/3 shadow-bulk md:-mt-4 md:mb-4'
              )}
            >
              {isCurrent && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                  <span className='rounded-full bg-green-500 px-4 py-1 text-sm font-bold text-background shadow-lg'>
                    Current Plan
                  </span>
                </div>
              )}

              {!isCurrent && tier.popular && !isSubscriberView && (
                <div className='absolute -top-3 left-1/2 -translate-x-1/2'>
                  <span className='bg-primary text-background rounded-full px-4 py-1 text-sm font-bold shadow-lg'>
                    Most Popular
                  </span>
                </div>
              )}

              <div className={cn('mb-5 rounded-lg p-4 text-center', tier.headerBg)}>
                <h3 className={cn('font-sedan-sc text-4xl', tier.color)}>{tier.name}</h3>
                <p className='text-neutral mt-1 text-lg font-medium'>{tier.tagline}</p>
              </div>

              <div className='mb-6 text-center'>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={billing}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className='flex items-end justify-center gap-1'>
                      <span className={cn('text-5xl font-bold', tier.color)}>
                        ${getMonthlyEquivalent(tier.monthlyPrice)}
                      </span>
                      <span className='text-neutral mb-1.5 text-2xl font-medium'>/mo</span>
                    </div>
                    {isYearly && (
                      <div className='mt-1.5'>
                        <span className='text-neutral text-lg line-through'>
                          {formatPrice(tier.monthlyPrice * 12)}
                        </span>
                        <span className='text-lg ml-2 font-semibold text-green-400'>
                          {formatPrice(Number(getPrice(tier.monthlyPrice)))}/year
                        </span>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {isCurrent ? (
                <div
                  onClick={() => dispatch(openUpgradeModalWithTier(tier.tierId))}
                  className={cn(
                    'w-full cursor-pointer rounded border-2 border-green-500/50 transition-all hover:bg-green-500/20 bg-green-500/10 px-4 py-3 text-center text-base font-bold hover:scale-[1.02] active:scale-[0.98] text-green-400'
                  )}
                >
                  Extend Plan
                </div>
              ) : isLower ? (
                <div
                  className={cn(
                    'w-full rounded border-2 border-tertiary/40 px-4 py-3 text-center text-base font-bold text-neutral'
                  )}
                >
                  Included
                </div>
              ) : (
                <button
                  onClick={() => dispatch(openUpgradeModalWithTier(tier.tierId))}
                  className={cn(
                    'w-full cursor-pointer rounded border-2 px-4 py-3 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]',
                    tier.buttonStyle
                  )}
                >
                  {isUpgrade ? `Upgrade to ${tier.name}` : tier.buttonText}
                </button>
              )}

              <ul className='mt-6 flex flex-col gap-3'>
                {tier.features.map((feature) => (
                  <li key={feature} className='flex items-center gap-2.5 text-lg font-medium'>
                    <div
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                        isCurrent ? 'bg-green-500/20' : tier.popular && !isSubscriberView ? 'bg-primary/20' : 'bg-white/10'
                      )}
                    >
                      <Check className={cn('h-3 w-3', isCurrent ? 'text-green-400' : tier.color)} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </motion.div>

      <div className='border-purple-400/50 flex w-full max-w-2xl flex-col items-center gap-3 rounded-lg border-2 px-6 py-5 text-center sm:flex-row sm:justify-between'>
        <div className='text-left'>
          <p className='text-lg font-bold'>Need something bigger?</p>
          <p className='text-neutral text-sm'>Patron tier for teams, funds, and institutions.</p>
        </div>
        <button
          onClick={() => dispatch(openUpgradeModalWithTier(4))}
          className='shrink-0 cursor-pointer rounded border-2 border-purple-400 px-5 py-2.5 text-base hover:scale-[1.02] active:scale-[0.98] font-semibold text-purple-400 transition-colors hover:bg-purple-400/10'
        >
          Explore Patron
        </button>
      </div>
    </section>
  )
}

export default ProPricing
