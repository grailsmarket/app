'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { Address } from 'viem'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectCategoryStatsConfig } from '@/state/reducers/dashboard/selectors'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { useClickAway } from '@/hooks/useClickAway'
import Price from '@/components/ui/price'
import { localizeNumber } from '@/utils/localizeNumber'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'

interface CategoryStatsWidgetProps {
  instanceId: string
}

const CategoryStatsWidget: React.FC<CategoryStatsWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectCategoryStatsConfig(state, instanceId))
  const { categories, categoriesLoading } = useCategories()
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)

  const categoryDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsCategoryOpen(false)
  })

  const details = useMemo(() => categories?.find((c) => c.name === config?.category), [categories, config?.category])

  const setCategory = useCallback(
    (category: string | null) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { category } }))
      setIsCategoryOpen(false)
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      <div className='border-tertiary flex items-center border-b'>
        <div ref={categoryDropdownRef} className='relative w-full'>
          <button
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>
              {details?.display_name ?? config.category ?? 'Select a category'}
            </p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isCategoryOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isCategoryOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex max-h-64 w-full flex-col overflow-y-auto rounded-md border-2 shadow-lg'>
              {categories?.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{cat.display_name}</p>
                  {config.category === cat.name && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {!config.category ? (
          <div className='text-neutral flex h-full items-center justify-center px-4 text-center text-sm'>
            Pick a category above to see its stats.
          </div>
        ) : categoriesLoading || !details ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-x-3 gap-y-3 p-3 sm:grid-cols-3'>
            <Stat label='Names' value={localizeNumber(details.member_count ?? 0)} />
            <Stat label='Holders' value={localizeNumber(details.holders_count ?? 0)} />
            <PriceStat
              label='Floor'
              price={details.floor_price_wei}
              currencyAddress={details.floor_price_currency as Address}
            />
            <PriceStat
              label='Volume (1mo)'
              price={details.sales_volume_wei_1mo}
              currencyAddress={details.floor_price_currency as Address}
            />
            <Stat label='Sales (1mo)' value={localizeNumber(details.sales_count_1mo ?? 0)} />
            <Stat
              label='Registered'
              value={`${localizeNumber(details.registered_count ?? 0)}`}
              subtext={`${(details.registered_percent ?? 0).toFixed(1)}%`}
            />
            <Stat
              label='Grace'
              labelClass='text-grace'
              value={localizeNumber(details.grace_count ?? 0)}
              subtext={`${(details.grace_percent ?? 0).toFixed(1)}%`}
            />
            <Stat
              label='Premium'
              labelClass='text-premium'
              value={localizeNumber(details.premium_count ?? 0)}
              subtext={
                details.member_count
                  ? `${(((details.premium_count ?? 0) / details.member_count) * 100).toFixed(1)}%`
                  : undefined
              }
            />
            <Stat label='Available' value={localizeNumber(details.available_count ?? 0)} />
          </div>
        )}
      </div>
    </div>
  )
}

interface StatProps {
  label: string
  value: string
  subtext?: string
  labelClass?: string
}
const Stat: React.FC<StatProps> = ({ label, value, subtext, labelClass }) => (
  <div className='border-neutral flex flex-col items-start border-l-2 pl-2'>
    <div className='flex items-baseline gap-1'>
      <span className='text-lg font-semibold'>{value}</span>
      {subtext && <span className='text-neutral text-xs font-medium'>({subtext})</span>}
    </div>
    <span className={cn('text-neutral text-xs', labelClass)}>{label}</span>
  </div>
)

interface PriceStatProps {
  label: string
  price: string | number
  currencyAddress: Address
}
const PriceStat: React.FC<PriceStatProps> = ({ label, price, currencyAddress }) => (
  <div className='border-neutral flex flex-col items-start border-l-2 pl-2'>
    <Price price={price} currencyAddress={currencyAddress} iconSize='14px' fontSize='text-lg font-semibold' />
    <span className='text-neutral text-xs'>{label}</span>
  </div>
)

export default CategoryStatsWidget
