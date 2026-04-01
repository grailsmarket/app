'use client'

import React, { useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectAnalyticsListConfig } from '@/state/reducers/dashboard/selectors'
import { useDashboardTopList } from '../../hooks/useDashboardAnalytics'
import { PERIOD_OPTIONS, SOURCE_OPTIONS } from '@/constants/analytics'
import type { AnalyticsPeriod, AnalyticsSource } from '@/types/analytics'
import { cn } from '@/utils/tailwind'

interface TopListWidgetProps {
  instanceId: string
}

const TopListWidget: React.FC<TopListWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectAnalyticsListConfig(state, instanceId))
  const { data, isLoading } = useDashboardTopList(instanceId)

  const results = useMemo(() => {
    if (!data) return []
    return (data as any)?.data?.results ?? []
  }, [data])

  const handlePeriodChange = useCallback(
    (period: AnalyticsPeriod) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { period } }))
    },
    [dispatch, instanceId]
  )

  const handleSourceChange = useCallback(
    (source: AnalyticsSource) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { source } }))
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  return (
    <div className='flex h-full flex-col'>
      {/* Controls */}
      <div className='border-tertiary flex flex-wrap items-center gap-1.5 border-b px-3 py-2'>
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value as AnalyticsPeriod)}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
              config.period === opt.value
                ? 'bg-primary text-background'
                : 'text-neutral hover:bg-white/10 hover:text-white'
            )}
          >
            {opt.label}
          </button>
        ))}
        <div className='bg-tertiary mx-1 h-4 w-px' />
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSourceChange(opt.value as AnalyticsSource)}
            className={cn(
              'cursor-pointer rounded px-2 py-0.5 text-xs font-medium transition-colors',
              config.source === opt.value
                ? 'bg-primary text-background'
                : 'text-neutral hover:bg-white/10 hover:text-white'
            )}
          >
            {opt.label}
          </button>
        ))}
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
