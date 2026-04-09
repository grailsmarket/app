'use client'

import { useAppDispatch } from '@/state/hooks'
import { openUpgradeModalWithTier } from '@/state/reducers/modals/upgradeModal'
import { cn } from '@/utils/tailwind'

// ── Tier definitions ──────────────────────────────────────────────
const ANNUAL_DISCOUNT = 0.15

const formatPrice = (price: number) => {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const tiers = [
  {
    tierId: 1,
    name: 'Plus',
    monthlyPrice: 19.99,
    lifetime: null,
    color: 'text-white',
    backgroundColor: 'bg-white',
    borderColor: 'border-white/40',
    headerBg: 'bg-white/5',
    buttonStyle: 'border-white text-white hover:bg-white/10',
    buttonText: 'Get Plus',
  },
  {
    tierId: 2,
    name: 'Pro',
    monthlyPrice: 49.99,
    lifetime: null,
    color: 'text-primary',
    backgroundColor: 'bg-primary',
    borderColor: 'border-primary/40',
    headerBg: 'bg-primary/5',
    buttonStyle: 'border-primary text-primary hover:bg-primary/10',
    buttonText: 'Get Pro',
  },
  {
    tierId: 3,
    name: 'Gold',
    monthlyPrice: 99.99,
    lifetime: null,
    color: 'text-amber-500',
    backgroundColor: 'bg-amber-500',
    borderColor: 'border-amber-500/40',
    headerBg: 'bg-amber-500/5',
    buttonStyle: 'border-amber-500 text-amber-500 hover:bg-amber-500/10',
    buttonText: 'Get Gold',
  },
  {
    tierId: 4,
    name: 'Patron',
    monthlyPrice: 10000,
    lifetime: null,
    color: 'text-purple-400',
    backgroundColor: 'bg-purple-400',
    borderColor: 'border-purple-400/40',
    headerBg: 'bg-purple-400/5',
    buttonStyle: 'border-purple-400 text-purple-400 hover:bg-purple-400/10',
    buttonText: 'Become Patron',
  },
  // {
  //   tierId: 5,
  //   name: 'Legend',
  //   monthlyPrice: null,
  //   lifetime: '$1,000,000.00',
  //   color: 'text-red-400',
  //   backgroundColor: 'bg-red-400',
  //   borderColor: 'border-red-400/40',
  //   headerBg: 'bg-red-400/5',
  //   buttonStyle: 'border-red-400 text-red-400 hover:bg-red-400/10',
  //   buttonText: 'Contact Us',
  // },
]

// ── Feature matrix ────────────────────────────────────────────────
// Each feature has a label and a boolean per tier [Plus, Pro, Gold, Patron, Legend]
const features: { label: string; tiers: boolean[] }[] = [
  { label: 'Badge on profile and avatar/header', tiers: [true, true, true, true] },
  { label: 'Google Metrics Filter/Sort', tiers: [true, true, true, true] },
  { label: 'Bulk Offers', tiers: [true, true, true, true] },
  { label: 'n of many Bulk Offers', tiers: [true, true, true, true] },
  { label: 'Telegram notifications', tiers: [true, true, true, true] },
  { label: 'First notification of new features and categories', tiers: [true, true, true, true] },
  { label: 'Your listings get in Featured Listings', tiers: [true, true, true, true] },
  { label: 'Customizable Dashboard', tiers: [false, true, true, true] },
  { label: 'Multiple watchlists', tiers: [false, true, true, true] },
  { label: 'Who viewed your Profile', tiers: [false, true, true, true] },
  { label: 'Who viewed your Name pages', tiers: [false, true, true, true] },
  { label: 'AI Recommendation page', tiers: [false, true, true, true] },
  { label: 'Saved Search/Filter/Sort', tiers: [false, true, true, true] },
  { label: 'Priority Support', tiers: [false, true, true, true] },
  { label: 'Get name on Sponsorship page (optional)', tiers: [false, false, true, true] },
  { label: 'Private Chat group', tiers: [false, false, true, true] },
  { label: 'Monthly video chat with team', tiers: [false, false, false, true] },
]

// ── Component ─────────────────────────────────────────────────────
const ProPageContent = () => {
  const dispatch = useAppDispatch()

  return (
    <>
      {/* Desktop */}
      <div className='hidden w-full overflow-x-auto md:block'>
        <table className='w-full border-collapse'>
          {/* Tier header row */}
          <thead>
            <tr>
              <th className='min-w-[260px] p-5' />
              {tiers.map((tier) => (
                <th
                  key={tier.name}
                  className={cn(
                    'min-w-[160px] rounded-t-lg border-x-2 border-t-2 p-5 text-center',
                    tier.borderColor,
                    tier.headerBg
                  )}
                >
                  <p className={cn('font-sedan-sc text-3xl', tier.color)}>{tier.name}</p>
                </th>
              ))}
            </tr>

            {/* Pricing rows */}
            <tr>
              <td className='border-tertiary border-b p-4 text-base font-semibold'>Monthly</td>
              {tiers.map((tier) => (
                <td
                  key={tier.name}
                  className={cn(
                    'border-x-2 border-b p-4 text-center text-base font-medium',
                    tier.borderColor,
                    'border-b-tertiary'
                  )}
                >
                  {tier.monthlyPrice != null ? formatPrice(tier.monthlyPrice) : <span className='text-neutral'>—</span>}
                </td>
              ))}
            </tr>
            <tr>
              <td className='border-tertiary border-b p-4 text-base font-semibold'>
                <div className='flex items-center gap-2'>
                  Annual
                  <span className='rounded-full bg-green-500/20 px-2.5 py-0.5 text-sm font-bold text-green-400'>
                    -15%
                  </span>
                </div>
              </td>
              {tiers.map((tier) => {
                if (tier.monthlyPrice == null) {
                  return (
                    <td
                      key={tier.name}
                      className={cn(
                        'border-x-2 border-b p-4 text-center text-base font-medium',
                        tier.borderColor,
                        'border-b-tertiary'
                      )}
                    >
                      <span className='text-neutral'>—</span>
                    </td>
                  )
                }
                const fullYear = tier.monthlyPrice * 12
                const discountedYear = fullYear * (1 - ANNUAL_DISCOUNT)
                return (
                  <td
                    key={tier.name}
                    className={cn(
                      'border-x-2 border-b p-4 text-center text-base font-medium',
                      tier.borderColor,
                      'border-b-tertiary'
                    )}
                  >
                    <span className='text-neutral mr-1.5 text-sm line-through'>{formatPrice(fullYear)}</span>
                    <span className='font-semibold text-green-400'>{formatPrice(discountedYear)}</span>
                  </td>
                )
              })}
            </tr>
            <tr>
              <td className='border-tertiary border-b p-4 text-base font-semibold'>Lifetime</td>
              {tiers.map((tier) => (
                <td
                  key={tier.name}
                  className={cn(
                    'border-x-2 border-b p-4 text-center text-base font-medium',
                    tier.borderColor,
                    'border-b-tertiary'
                  )}
                >
                  {tier.lifetime ?? <span className='text-neutral'>—</span>}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, i) => (
              <tr key={feature.label} className={i % 2 === 0 ? 'bg-white/2' : ''}>
                <td className='border-tertiary border-b p-4 text-base font-medium'>{feature.label}</td>
                {feature.tiers.map((included, j) => {
                  return (
                    <td
                      key={tiers[j].name}
                      className={cn(
                        'border-x-2 border-b p-4 text-center',
                        tiers[j].borderColor,
                        'border-b-tertiary',
                        i === features.length - 1 && 'border-b-2 ' + tiers[j].borderColor
                      )}
                    >
                      {included ? (
                        <div
                          className={cn(
                            'mx-auto flex h-6 w-6 items-center justify-center rounded-sm',
                            tiers[j].backgroundColor
                          )}
                        >
                          <span className='text-background font-sans text-xl font-black'>&#10003;</span>
                        </div>
                      ) : (
                        <span className='text-neutral text-lg'>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className='p-5' />
              {tiers.map((tier) => (
                <td
                  key={tier.name}
                  className={cn('rounded-b-lg border-x-2 border-b-2 p-5 text-center', tier.borderColor)}
                >
                  <button
                    onClick={() => dispatch(openUpgradeModalWithTier(tier.tierId))}
                    className={cn(
                      'w-full cursor-pointer rounded border-2 px-4 py-2.5 text-base font-semibold transition-colors',
                      tier.buttonStyle
                    )}
                  >
                    {tier.buttonText}
                  </button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile */}
      <div className='flex w-full flex-col gap-4 md:hidden'>
        {tiers.map((tier) => (
          <div key={tier.name} className={cn('rounded-lg border-2 p-6', tier.borderColor)}>
            <h3 className={cn('font-sedan-sc text-center text-4xl', tier.color)}>{tier.name}</h3>

            {/* Pricing */}
            <div className='mt-3 space-y-1.5 text-center text-base'>
              {tier.monthlyPrice != null && (
                <p>
                  <span className='text-neutral'>Monthly:</span>{' '}
                  <span className='font-semibold'>{formatPrice(tier.monthlyPrice)}</span>
                </p>
              )}
              {tier.monthlyPrice != null && (
                <p className='flex items-center justify-center gap-1.5'>
                  <span className='text-neutral'>Annual:</span>{' '}
                  <span className='text-neutral text-sm line-through'>{formatPrice(tier.monthlyPrice * 12)}</span>
                  <span className='font-semibold text-green-400'>
                    {formatPrice(tier.monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT))}
                  </span>
                  <span className='rounded-full bg-green-500/20 px-2 py-0.5 text-sm font-bold text-green-400'>
                    -15%
                  </span>
                </p>
              )}
              {tier.lifetime && (
                <p>
                  <span className='text-neutral'>Lifetime:</span> <span className='font-semibold'>{tier.lifetime}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => dispatch(openUpgradeModalWithTier(tier.tierId))}
              className={cn(
                'mt-4 w-full cursor-pointer rounded border-2 px-4 py-2.5 text-lg font-semibold transition-colors',
                tier.buttonStyle
              )}
            >
              {tier.buttonText}
            </button>
            <ul className='mt-5 space-y-2.5'>
              {features.map((feature) => {
                const tierIndex = tiers.findIndex((t) => t.name === tier.name)
                const included = feature.tiers[tierIndex]
                return (
                  <li
                    key={feature.label}
                    className={cn('flex items-start gap-2 text-base', !included && 'text-neutral/40')}
                  >
                    <span className={cn('mt-0.5 shrink-0 text-lg', included ? tier.color : 'text-neutral/40')}>
                      {included ? '✓' : '—'}
                    </span>
                    {feature.label}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </>
  )
}

export default ProPageContent
