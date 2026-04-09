'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectAnalyticsListConfig } from '@/state/reducers/dashboard/selectors'
import { useDashboardTopList } from '../../hooks/useDashboardAnalytics'
import { PERIOD_OPTIONS, SOURCE_OPTIONS } from '@/constants/analytics'
import type { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import Image from 'next/image'
import { useClickAway } from '@/hooks/useClickAway'

interface TopListWidgetProps {
  instanceId: string
}

const TopListWidget: React.FC<TopListWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectAnalyticsListConfig(state, instanceId))
  const { data, isLoading } = useDashboardTopList(instanceId)
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [isSourceOpen, setIsSourceOpen] = useState(false)

  const periodDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsPeriodOpen(false)
  })

  const sourceDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsSourceOpen(false)
  })

  const results = useMemo(() => {
    if (!data) return []
    return (data as any)?.data?.results ?? []
  }, [data])

  const handlePeriodChange = useCallback(
    (period: AnalyticsPeriod) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { period } }))
      setIsPeriodOpen(false)
    },
    [dispatch, instanceId]
  )

  const handleSourceChange = useCallback(
    (source: AnalyticsSource) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { source } }))
      setIsSourceOpen(false)
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  const periodLabel = PERIOD_OPTIONS.find((opt) => opt.value === config.period)?.label ?? config.period
  const sourceLabel = SOURCE_OPTIONS.find((opt) => opt.value === config.source)?.label ?? config.source
  const sourceIcon = SOURCE_OPTIONS.find((opt) => opt.value === config.source)?.icon ?? null

  return (
    <div className='flex h-full flex-col'>
      {/* Controls */}
      <div className='border-tertiary flex items-center border-b'>
        {/* Period dropdown */}
        <div ref={periodDropdownRef} className='relative w-1/2'>
          <button
            onClick={() => {
              setIsPeriodOpen(!isPeriodOpen)
              setIsSourceOpen(false)
            }}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <p className='max-w-[90%] truncate text-lg'>{periodLabel}</p>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isPeriodOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isPeriodOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex w-full flex-col rounded-md border-2 shadow-lg'>
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handlePeriodChange(opt.value as AnalyticsPeriod)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <p>{opt.label}</p>
                  {config.period === opt.value && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Source dropdown */}
        <div ref={sourceDropdownRef} className='border-tertiary relative w-1/2 border-l-2'>
          <button
            onClick={() => {
              setIsSourceOpen(!isSourceOpen)
              setIsPeriodOpen(false)
            }}
            className='hover:bg-secondary flex h-10 w-full cursor-pointer items-center justify-between px-3 transition-colors'
          >
            <div className='flex items-center gap-2'>
              {sourceIcon && <Image src={sourceIcon} alt={sourceLabel} width={20} height={20} />}
              <p className='text-lg'>{sourceLabel}</p>
            </div>
            <ShortArrow className={cn('h-3 w-3 transition-transform', isSourceOpen ? 'rotate-0' : 'rotate-180')} />
          </button>
          {isSourceOpen && (
            <div className='border-tertiary bg-background absolute top-11 left-0 z-10 flex w-full flex-col rounded-md border-2 shadow-lg'>
              {SOURCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSourceChange(opt.value as AnalyticsSource)}
                  className='hover:bg-secondary flex cursor-pointer items-center justify-between px-3 py-2 text-lg font-medium transition-colors'
                >
                  <div className='flex items-center gap-2'>
                    {opt.icon && <Image src={opt.icon} alt={opt.label} width={20} height={20} />}
                    <p>{opt.label}</p>
                  </div>
                  {config.source === opt.value && <Check className='text-primary h-4 w-4' />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto'>
        {isLoading ? (
          <div className='flex h-full items-center justify-center'>
            <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2' />
          </div>
        ) : results.length === 0 ? (
          <div className='text-neutral flex h-full items-center justify-center text-sm'>No data</div>
        ) : (
          <div className='divide-tertiary divide-y'>
            {results.map((item: any, i: number) => (
              <div key={item.id ?? i} className='flex items-center gap-3 px-3 py-2 text-sm'>
                <span className='text-neutral w-5 shrink-0 text-right text-xs'>{i + 1}</span>
                <span className='min-w-0 flex-1 truncate font-medium'>{item.name}</span>
                <span className='text-neutral shrink-0 text-xs'>
                  {item.sale_price_wei || item.offer_amount_wei || item.price_wei || item.total_cost_wei
                    ? `${(Number(item.sale_price_wei || item.offer_amount_wei || item.price_wei || item.total_cost_wei) / 1e18).toFixed(4)} ETH`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TopListWidget
