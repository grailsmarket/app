'use client'

import React, { useCallback, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectAnalyticsChartConfig } from '@/state/reducers/dashboard/selectors'
import { useDashboardChart } from '../../hooks/useDashboardAnalytics'
import AnalyticsChart from '@/app/analytics/components/AnalyticsChart'
import { PERIOD_OPTIONS } from '@/constants/analytics'
import type { AnalyticsPeriod } from '@/types/analytics'
import { cn } from '@/utils/tailwind'
import { Check, ShortArrow } from 'ethereum-identity-kit'
import { useClickAway } from '@/hooks/useClickAway'

const CHART_TYPE_LABELS: Record<string, string> = {
  'sales-chart': 'Sales',
  'offers-chart': 'Offers',
  'registrations-chart': 'Registrations',
}

interface ChartWidgetProps {
  instanceId: string
}

const ChartWidget: React.FC<ChartWidgetProps> = ({ instanceId }) => {
  const dispatch = useAppDispatch()
  const config = useAppSelector((state) => selectAnalyticsChartConfig(state, instanceId))
  const { data, isLoading } = useDashboardChart(instanceId)

  const [isPeriodOpen, setIsPeriodOpen] = useState(false)

  const periodDropdownRef = useClickAway<HTMLDivElement>(() => {
    setIsPeriodOpen(false)
  })

  const handlePeriodChange = useCallback(
    (period: AnalyticsPeriod) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { period } }))
      setIsPeriodOpen(false)
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  const chartData = (data as any)?.data?.points
  const title = CHART_TYPE_LABELS[config.type] ?? 'Chart'
  const periodLabel = PERIOD_OPTIONS.find((opt) => opt.value === config.period)?.label ?? config.period

  return (
    <div className='flex h-full flex-col'>
      {/* Controls */}
      <div className='border-tertiary flex items-center border-b'>
        <div ref={periodDropdownRef} className='relative w-full'>
          <button
            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
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
      </div>

      {/* Chart */}
      <div className='flex-1 p-2'>
        <AnalyticsChart title={title} data={chartData} source='all' isLoading={isLoading} />
      </div>
    </div>
  )
}

export default ChartWidget
