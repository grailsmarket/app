'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAppDispatch } from '@/state/hooks'
import { openUpgradeModalWithTier } from '@/state/reducers/modals/upgradeModal'
import { cn } from '@/utils/tailwind'

const tiers = [
  {
    tierId: 1,
    name: 'Plus',
    monthlyPrice: 19.99,
    buttonText: 'Enroll',
    borderColor: 'border-white',
    nameColor: 'text-white',
    priceColor: 'text-white',
    buttonStyle: 'border-white text-white hover:bg-white/10',
    features: [
      'Bulk Offers',
      'Name views info',
      'AI recommended search',
      'Customizable dashboard',
      'Multiple watchlists',
      'Profile views info',
      'Filter/Sort by google metrics',
    ],
  },
  {
    tierId: 2,
    name: 'PRO',
    monthlyPrice: 49.99,
    buttonText: 'Become a PRO user',
    borderColor: 'border-primary',
    nameColor: 'text-primary',
    priceColor: 'text-primary',
    buttonStyle: 'border-primary text-primary hover:bg-primary/10',
    features: ['Everything in Plus', 'Exclusive new feature notifications', 'Customizable dashboard'],
  },
  {
    tierId: 3,
    name: 'Gold',
    monthlyPrice: 99.99,
    buttonText: 'Get Gold',
    borderColor: 'border-amber-500',
    nameColor: 'text-amber-500',
    priceColor: 'text-amber-500',
    buttonStyle: 'border-amber-500 text-amber-500 hover:bg-amber-500/10',
    features: ['Everything in Plus', 'Everything in PRO', 'Exclusive Grails Whales Telegram'],
  },
]

type BillingPeriod = 'monthly' | 'yearly'

const PricingTiers = () => {
  const dispatch = useAppDispatch()
  const [billing, setBilling] = useState<BillingPeriod>('monthly')

  const isYearly = billing === 'yearly'

  const ANNUAL_DISCOUNT = 0.15

  const getDisplayPrice = (monthlyPrice: number) => {
    if (isYearly) {
      // 15% off yearly: (monthly * 12) * 0.85 / 12
      return ((monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT)) / 12).toFixed(2)
    }
    return monthlyPrice.toFixed(2)
  }

  const getYearlyTotal = (monthlyPrice: number) => {
    return (monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT)).toFixed(2)
  }

  const getOriginalYearlyTotal = (monthlyPrice: number) => {
    return (monthlyPrice * 12).toFixed(2)
  }

  return (
    <div className='flex w-full flex-col items-center gap-8'>
      <h2 className='font-sedan-sc text-center text-5xl md:text-6xl'>
        Do more, with Grails <span className='text-primary'>Pro</span>
      </h2>

      {/* Billing toggle */}
      <div className='flex items-center gap-3'>
        <div className='bg-secondary relative flex w-96 rounded-full p-1'>
          <button
            onClick={() => setBilling('monthly')}
            className={`relative z-10 w-1/2 cursor-pointer justify-center rounded-full px-5 py-2 text-lg font-semibold transition-colors ${
              !isYearly ? 'text-background' : 'text-neutral hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`relative z-10 flex w-1/2 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2 text-lg font-semibold transition-colors ${
              isYearly ? 'text-background' : 'text-neutral hover:text-white'
            }`}
          >
            <span>Yearly</span>
            <span
              className={cn(
                'text-md rounded-full px-2 py-0.5 font-bold',
                isYearly ? 'bg-green-500/50 text-green-700' : 'bg-green-500/20 text-green-400'
              )}
            >
              SAVE 15%
            </span>
          </button>
          <div
            className={`bg-primary absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ${
              isYearly ? 'left-[calc(50%+2px)]' : 'left-1'
            }`}
          />
        </div>
      </div>

      <div className='flex w-full flex-col flex-wrap items-center justify-center gap-6 lg:flex-row lg:items-stretch lg:justify-center'>
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`flex w-full flex-1 flex-col rounded-lg border-2 lg:max-w-sm ${tier.borderColor} p-6`}
          >
            <h3 className={`font-sedan-sc text-center text-5xl ${tier.nameColor}`}>{tier.name}</h3>

            <div className='mt-2 text-center'>
              {isYearly && <p className='text-neutral text-md mb-1 line-through'>${tier.monthlyPrice.toFixed(2)}/mo</p>}
              <p>
                <span className={`text-4xl font-bold ${tier.priceColor}`}>${getDisplayPrice(tier.monthlyPrice)}</span>{' '}
                <span className='text-md font-medium tracking-wide'>per Month</span>
              </p>
              {isYearly && (
                <p className='text-neutral text-md mt-1'>
                  <span className='line-through'>${getOriginalYearlyTotal(tier.monthlyPrice)}</span>{' '}
                  <span className='font-semibold text-green-400'>${getYearlyTotal(tier.monthlyPrice)}/year</span>
                </p>
              )}
            </div>

            <button
              onClick={() => dispatch(openUpgradeModalWithTier(tier.tierId))}
              className={`mt-4 w-full cursor-pointer rounded border-2 px-4 py-2 font-semibold transition-colors ${tier.buttonStyle}`}
            >
              {tier.buttonText}
            </button>
            <ul className='mt-6 list-disc space-y-2 pl-6'>
              {tier.features.map((feature) => (
                <li key={feature} className='text-base font-medium'>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <Link
        href='/pro'
        className='text-primary hover:text-primary/80 text-lg font-semibold underline underline-offset-4 transition-colors'
      >
        See all plans &amp; compare features →
      </Link>
    </div>
  )
}

export default PricingTiers
