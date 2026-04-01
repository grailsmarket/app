'use client'

import React, { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { updateComponentConfig } from '@/state/reducers/dashboard'
import { selectAnalyticsChartConfig } from '@/state/reducers/dashboard/selectors'
import { useDashboardChart } from '../../hooks/useDashboardAnalytics'
import AnalyticsChart from '@/app/analytics/components/AnalyticsChart'
import { PERIOD_OPTIONS } from '@/constants/analytics'
import type { AnalyticsPeriod } from '@/types/analytics'
import { cn } from '@/utils/tailwind'

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

  const handlePeriodChange = useCallback(
    (period: AnalyticsPeriod) => {
      dispatch(updateComponentConfig({ id: instanceId, patch: { period } }))
    },
    [dispatch, instanceId]
  )

  if (!config) return null

  const chartData = (data as any)?.data?.points
  const title = CHART_TYPE_LABELS[config.type] ?? 'Chart'

  return (
    <div className='flex h-full flex-col'>
      {/* Controls */}
      <div className='border-tertiary flex items-center gap-1.5 border-b px-3 py-2'>
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
      </div>

      {/* Chart */}
      <div className='flex-1 p-2'>
        <AnalyticsChart title={title} data={chartData} source='all' isLoading={isLoading} />
      </div>
    </div>
  )
}

export default ChartWidget
